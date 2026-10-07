<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AttendanceAutoService;
use App\Services\GuardStudentStatusService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GuardStudentTrackingController extends Controller
{
    public function __construct(
        protected GuardStudentStatusService $statusService
    ) {}

    public function index(Request $request): Response
    {
        $now = now('Asia/Manila');
        $schedules = $this->statusService->todaySchedules($now);
        $students = $this->statusService->getTrackingStudents($now);

        $summary = [
            'inClass' => 0,
            'late' => 0,
            'absent' => 0,
            'vacant' => 0,
            'done' => 0,
        ];

        foreach ($students as $student) {
            $status = strtolower((string) $student['status']);

            if ($status === 'in class') {
                $summary['inClass']++;

                continue;
            }

            if ($status === 'late') {
                $summary['late']++;

                continue;
            }

            if ($status === 'absent') {
                $summary['absent']++;

                continue;
            }

            if ($status === 'classes done') {
                $summary['done']++;

                continue;
            }

            $summary['vacant']++;
        }

        return Inertia::render('guard/StudentTracking', [
            'students' => $students,
            'summary' => $summary,
            'schedules' => $schedules->map(fn ($schedule) => [
                'id' => $schedule->id,
                'subject' => $schedule->subject,
                'section' => $schedule->section ?: 'No section',
                'location' => $schedule->location ?: 'No location',
            ])->values()->all(),
        ]);
    }

    public function show(User $student, AttendanceAutoService $sessions): Response
    {
        abort_unless($student->role === 'student', 404);
        $now = now('Asia/Manila');
        $schedules = $student->registeredSchedules()->orderBy('start_time')->get()
            ->map(function ($schedule) use ($sessions, $now): array {
                $state = $schedule->status === 'Completed' ? 'Completed' : 'No upcoming session';
                $next = null;
                if ($schedule->pivot->status !== 'active') {
                    $state = 'Inactive enrollment';
                } elseif ($schedule->status !== 'Completed') {
                    // Include yesterday for classes that continue past midnight.
                    for ($offset = -1; $offset <= 7; $offset++) {
                        $session = $sessions->session($schedule, $now->addDays($offset)->toDateString());
                        if (! $session || $session[1]->lt($now)) {
                            continue;
                        }
                        $state = $session[0]->lte($now) ? 'Ongoing' : 'Pending';
                        $next = ['start' => $session[0]->toIso8601String(), 'end' => $session[1]->toIso8601String()];
                        break;
                    }
                }

                return [
                    'id' => $schedule->id, 'subject' => $schedule->subject,
                    'instructor' => $schedule->instructor, 'location' => $schedule->location,
                    'section' => $schedule->section, 'days' => $schedule->days ?? [],
                    'start_time' => substr($schedule->start_time ?? '', 0, 5),
                    'end_time' => substr($schedule->end_time ?? '', 0, 5),
                    'state' => $state, 'next_session' => $next,
                ];
            });
        $records = $student->attendances()->with('schedule:id,subject')
            ->orderByDesc('attendance_date')->orderByDesc('id')->paginate(20)
            ->through(fn ($record) => [
                'id' => $record->id, 'subject' => $record->schedule?->subject ?? 'Deleted class',
                'date' => $record->attendance_date?->toDateString(), 'status' => $record->status,
                'time_in' => $record->time_in?->format('H:i'), 'time_out' => $record->time_out?->format('H:i'),
                'source' => $record->latitude !== null || $record->longitude !== null ? 'GPS' : 'Manual / automatic',
            ]);

        return Inertia::render('guard/StudentDetails', [
            'student' => $student->only(['id', 'name', 'student_id', 'course', 'year', 'section', 'profile_picture_url']),
            'schedules' => $schedules, 'records' => $records,
        ]);
    }
}
