<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Services\GuardStudentStatusService;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class GuardDashboardController extends Controller
{
    public function __construct(
        protected GuardStudentStatusService $statusService
    ) {}

    public function index(): Response
    {
        $now = now('Asia/Manila');
        $schedules = $this->statusService->todaySchedules($now);

        $classes = $schedules
            ->map(function (Schedule $schedule) use ($now): array {
                $students = $schedule->registeredStudents->sortBy('name');

                return [
                    'id' => $schedule->id,
                    'subject' => $schedule->subject,
                    'section' => $schedule->section ?: 'No section',
                    'instructor' => $schedule->instructor ?: 'N/A',
                    'startTime' => $this->formatTime($schedule->start_time),
                    'endTime' => $this->formatTime($schedule->end_time),
                    'location' => $schedule->location ?: 'No location',
                    'status' => $this->statusService->getScheduleStatus(
                        $schedule,
                        $now
                    ),
                    'studentCount' => $students->count(),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('guard/Dashboard', [
            'classes' => $classes,
        ]);
    }

    public function show(Schedule $schedule): Response
    {
        $now = now('Asia/Manila');
        $today = $now->toDateString();

        $students = $schedule->registeredStudents->sortBy('name');

        $attendanceRecords = Attendance::query()
            ->where('schedule_id', $schedule->id)
            ->whereDate('attendance_date', $today)
            ->get()
            ->keyBy('student_id');

        $studentRows = $students
            ->map(function ($student) use ($attendanceRecords): array {
                $attendance = $attendanceRecords->get($student->id);
                $status = 'Absent';

                if ($attendance) {
                    $status = match (strtolower(trim((string) $attendance->status))) {
                        'present' => 'Present',
                        'late' => 'Late',
                        default => 'Absent',
                    };
                }

                return [
                    'id' => $student->id,
                    'name' => $student->name,
                    'studentNumber' => $student->student_id ?: 'Not assigned',
                    'course' => $student->course ?: 'N/A',
                    'year' => $student->year ?: 'N/A',
                    'section' => $student->section ?: 'N/A',
                    'status' => $status,
                ];
            })
            ->values()
            ->all();

        $present = count(array_filter($studentRows, fn (array $student): bool => $student['status'] === 'Present'));
        $late = count(array_filter($studentRows, fn (array $student): bool => $student['status'] === 'Late'));
        $absent = count(array_filter($studentRows, fn (array $student): bool => $student['status'] === 'Absent'));

        return Inertia::render('guard/ClassDetails', [
            'classDetails' => [
                'id' => $schedule->id,
                'subject' => $schedule->subject,
                'section' => $schedule->section ?: 'No section',
                'instructor' => $schedule->instructor ?: 'N/A',
                'startTime' => $this->formatTime($schedule->start_time),
                'endTime' => $this->formatTime($schedule->end_time),
                'location' => $schedule->location ?: 'No location',
                'status' => $this->statusService->getScheduleStatus(
                    $schedule,
                    $now
                ),
            ],
            'students' => $studentRows,
            'statistics' => [
                'total' => count($studentRows),
                'present' => $present,
                'late' => $late,
                'absent' => $absent,
            ],
        ]);
    }

    protected function formatTime(?string $time): string
    {
        if (! $time) {
            return '';
        }

        try {
            return Carbon::parse($time)->format('h:i A');
        } catch (\Throwable) {
            return (string) $time;
        }
    }
}
