<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstructorDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $today = now()->format('l');

        $schedules = Schedule::query()
            ->where('user_id', $user->id)
            ->withCount([
                'attendances as present_count' => fn ($query) =>
                    $query->where('status', 'Present'),

                'attendances as late_count' => fn ($query) =>
                    $query->where('status', 'Late'),

                'attendances as absent_count' => fn ($query) =>
                    $query->where('status', 'Absent'),
            ])
            ->orderBy('start_time')
            ->get();

        $todaySchedules = $schedules
            ->filter(function (Schedule $schedule) use ($today): bool {
                return in_array(
                    $today,
                    $this->getScheduleDays($schedule->days),
                    true
                );
            })
            ->values();

        $totalStudents = (int) $schedules->sum('students');
        $totalPresent = (int) $schedules->sum('present_count');
        $totalLate = (int) $schedules->sum('late_count');

        $averageAttendance = $totalStudents > 0
            ? round(
                (($totalPresent + $totalLate) / $totalStudents) * 100,
                1
            )
            : 0;

        $classAttendance = $schedules
            ->map(fn (Schedule $schedule): array => [
                'className' => $schedule->subject,
                'present' => (int) $schedule->present_count,
                'absent' => (int) $schedule->absent_count,
            ])
            ->values();

        $todayClasses = $todaySchedules
            ->map(fn (Schedule $schedule): array => [
                'id' => $schedule->id,
                'className' => $schedule->subject,
                'section' => $schedule->section,
                'startTime' => $schedule->start_time,
                'endTime' => $schedule->end_time,
                'location' => $schedule->location,
                'studentCount' => (int) $schedule->students,
                'presentCount' => (int) $schedule->present_count,
                'status' => $this->getDisplayStatus($schedule),
            ])
            ->values();

        return Inertia::render('instructor/Dashboard', [
            'instructorStats' => [
                'myClasses' => $schedules->count(),
                'totalStudents' => $totalStudents,
                'averageAttendance' => $averageAttendance,
                'attendanceChange' => 0,
                'classesToday' => $todaySchedules->count(),
            ],
            'classAttendance' => $classAttendance,
            'todayClasses' => $todayClasses,
        ]);
    }

    public function show(
        Request $request,
        Schedule $schedule
    ): Response {
        abort_unless(
            (int) $schedule->user_id ===
                (int) $request->user()->id,
            403,
            'You are not allowed to view this class.'
        );

        $students = $schedule->section
            ? User::query()
                ->where('role', 'student')
                ->where('section', $schedule->section)
                ->orderBy('name')
                ->get()
            : collect();

        $attendanceRecords = Attendance::query()
            ->where('schedule_id', $schedule->id)
            ->get()
            ->keyBy('student_id');

        $studentRoster = $students
            ->map(function (User $student) use (
                $attendanceRecords
            ): array {
                $attendance = $attendanceRecords->get(
                    $student->id
                );

                return [
                    'id' => $student->id,
                    'name' => $student->name,
                    'studentNumber' => 'STU-'.str_pad(
                        (string) $student->id,
                        4,
                        '0',
                        STR_PAD_LEFT
                    ),
                    'status' => $attendance?->status
                        ?? 'Absent',
                    'timeIn' => $attendance?->time_in
                        ? $attendance->time_in->format('h:i A')
                        : null,
                ];
            })
            ->values();

        return Inertia::render('instructor/ClassDetails', [
            'classDetails' => [
                'id' => $schedule->id,
                'subject' => $schedule->subject,
                'section' => $schedule->section,
                'startTime' => $schedule->start_time,
                'endTime' => $schedule->end_time,
                'location' => $schedule->location,
                'status' => $this->getDisplayStatus(
                    $schedule
                ),
            ],
            'students' => $studentRoster,
            'statistics' => [
                'total' => $studentRoster->count(),
                'present' => $studentRoster
                    ->where('status', 'Present')
                    ->count(),
                'late' => $studentRoster
                    ->where('status', 'Late')
                    ->count(),
                'absent' => $studentRoster
                    ->where('status', 'Absent')
                    ->count(),
            ],
        ]);
    }

    private function getScheduleDays(
        array|string|null $days
    ): array {
        if (is_array($days)) {
            return $days;
        }

        if (! is_string($days) || $days === '') {
            return [];
        }

        $decoded = json_decode($days, true);

        if (is_array($decoded)) {
            return $decoded;
        }

        return array_values(
            array_filter(
                array_map('trim', explode(',', $days))
            )
        );
    }

    private function getDisplayStatus(
        Schedule $schedule
    ): string {
        $savedStatus = strtolower(
            (string) $schedule->status
        );

        if (
            $savedStatus === 'completed' ||
            $savedStatus === 'done'
        ) {
            return 'Done';
        }

        if ($savedStatus === 'ongoing') {
            return 'Ongoing';
        }

        if (
            ! $schedule->start_time ||
            ! $schedule->end_time
        ) {
            return 'Upcoming';
        }

        $now = now();

        $start = now()->setTimeFromTimeString(
            $schedule->start_time
        );

        $end = now()->setTimeFromTimeString(
            $schedule->end_time
        );

        if ($now->greaterThan($end)) {
            return 'Done';
        }

        if ($now->between($start, $end)) {
            return 'Ongoing';
        }

        return 'Upcoming';
    }
}