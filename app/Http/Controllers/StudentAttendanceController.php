<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentAttendanceController extends Controller
{
    /**
     * Display attendance records belonging
     * to the authenticated student.
     */
    public function index(
        Request $request
    ): Response {
        $student = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Classes available to this student
        |--------------------------------------------------------------------------
        |
        | Include:
        | 1. Registered classes
        | 2. Classes assigned to student's section
        |
        */

        $registeredScheduleIds = $student
            ->registeredSchedules()
            ->pluck('schedules.id');

        $sectionScheduleIds = collect();

        if (
            $student->section !== null &&
            trim((string) $student->section) !== ''
        ) {
            $section = trim(
                (string) $student->section
            );

            $sectionScheduleIds =
                Schedule::query()
                    ->where(function ($query) use ($section) {
                        $query
                            ->whereRaw(
                                'LOWER(TRIM(section)) = ?',
                                [strtolower($section)]
                            )
                            ->orWhereNull('section');
                    })
                    ->pluck('id');
        }

        $allowedScheduleIds =
            $registeredScheduleIds
                ->concat($sectionScheduleIds)
                ->unique()
                ->values();

        /*
        |--------------------------------------------------------------------------
        | Attendance
        |--------------------------------------------------------------------------
        */

        $attendance = Attendance::query()
            ->where(
                'student_id',
                $student->id
            )
            ->whereIn(
                'schedule_id',
                $allowedScheduleIds
            )
            ->with([
                'schedule' => function ($query) {
                    $query->select([
                        'id',
                        'subject',
                        'section',
                        'instructor',
                        'location',
                        'start_time',
                        'end_time',
                    ]);
                },
            ])
            ->orderByDesc('attendance_date')
            ->orderByDesc('time_in')
            ->get([
                'id',
                'student_id',
                'schedule_id',
                'attendance_date',
                'status',
                'time_in',
                'time_out',
                'latitude',
                'longitude',
                'created_at',
            ])
            ->map(function (
                Attendance $attendance
            ): array {
                return [
                    'id' => $attendance->id,

                    'status' => $attendance->status,

                    'attendance_date' => $attendance
                        ->attendance_date
                        ?->format('Y-m-d'),

                    'time_in' => $attendance
                        ->time_in
                        ?->setTimezone(
                            'Asia/Manila'
                        )
                        ->format('H:i:s'),

                    'time_out' => $attendance
                        ->time_out
                        ?->setTimezone(
                            'Asia/Manila'
                        )
                        ->format('H:i:s'),

                    'latitude' => $attendance->latitude,

                    'longitude' => $attendance->longitude,

                    'schedule' => $attendance->schedule
                            ? [
                                'id' => $attendance
                                    ->schedule
                                    ->id,

                                'subject' => $attendance
                                    ->schedule
                                    ->subject,

                                'section' => $attendance
                                    ->schedule
                                    ->section,

                                'instructor' => $attendance
                                    ->schedule
                                    ->instructor,

                                'location' => $attendance
                                    ->schedule
                                    ->location,

                                'start_time' => $attendance
                                    ->schedule
                                    ->start_time,

                                'end_time' => $attendance
                                    ->schedule
                                    ->end_time,
                            ]
                            : null,
                ];
            })
            ->values();

        return Inertia::render(
            'student/Attendance',
            [
                'attendance' => $attendance,
            ]
        );
    }
}
