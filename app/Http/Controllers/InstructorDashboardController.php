<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class InstructorDashboardController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): Response
    {
        $instructor = $request->user();

        $now = now('Asia/Manila');

        $today = $now->toDateString();

        $todayName = $now->format('D');

        /*
        |--------------------------------------------------------------------------
        | Instructor schedules
        |--------------------------------------------------------------------------
        */

        $schedules = Schedule::query()
            ->where(function ($query) use ($instructor) {
                $query
                    ->where(
                        'user_id',
                        $instructor->id
                    )
                    ->orWhere(
                        'instructor_id',
                        $instructor->id
                    );
            })
            ->with([
                'registeredStudents',
            ])
            ->orderBy('start_time')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Class attendance statistics
        |--------------------------------------------------------------------------
        */

        $classAttendance = $schedules
            ->map(function (Schedule $schedule) use ($today): array {
                $students = $this
                    ->getStudentsForSchedule(
                        $schedule
                    );

                $studentIds = $students
                    ->pluck('id');

                $attendances = Attendance::query()
                    ->where(
                        'schedule_id',
                        $schedule->id
                    )
                    ->whereIn(
                        'student_id',
                        $studentIds
                    )
                    ->where(function ($query) use ($today) {
                        $query
                            ->whereDate(
                                'attendance_date',
                                $today
                            )
                            ->orWhere(function ($query) use ($today) {
                                $query
                                    ->whereNull(
                                        'attendance_date'
                                    )
                                    ->whereDate(
                                        'created_at',
                                        $today
                                    );
                            });
                    })
                    ->orderByDesc('time_in')
                    ->orderByDesc('created_at')
                    ->get()
                    ->unique('student_id');

                $present = $attendances
                    ->filter(
                        fn ($attendance): bool => strtolower(
                            trim(
                                (string) $attendance->status
                            )
                        ) === 'present'
                    )
                    ->count();

                $late = $attendances
                    ->filter(
                        fn ($attendance): bool => strtolower(
                            trim(
                                (string) $attendance->status
                            )
                        ) === 'late'
                    )
                    ->count();

                $absentRecords = $attendances
                    ->filter(
                        fn ($attendance): bool => strtolower(
                            trim(
                                (string) $attendance->status
                            )
                        ) === 'absent'
                    )
                    ->count();

                $recordedStudentIds = $attendances
                    ->pluck('student_id')
                    ->unique();

                $notRecorded = $studentIds
                    ->diff(
                        $recordedStudentIds
                    )
                    ->count();

                return [
                    'id' => $schedule->id,

                    'className' => $schedule->subject,

                    'present' => $present + $late,

                    'absent' => $absentRecords +
                        $notRecorded,

                    'studentCount' => $students->count(),
                ];
            })
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Dashboard totals
        |--------------------------------------------------------------------------
        */

        $totalStudents = (int)
            $classAttendance->sum(
                'studentCount'
            );

        $totalPresent = (int)
            $classAttendance->sum(
                'present'
            );

        $totalPossible = (int)
            $classAttendance->sum(
                function (array $class): int {
                    return
                        (int) $class['present'] +
                        (int) $class['absent'];
                }
            );

        $averageAttendance =
            $totalPossible > 0
                ? round(
                    (
                        $totalPresent /
                        $totalPossible
                    ) * 100,
                    1
                )
                : 0;

        /*
        |--------------------------------------------------------------------------
        | Today's classes
        |--------------------------------------------------------------------------
        */

        $todaySchedules = $schedules
            ->filter(
                function (
                    Schedule $schedule
                ) use ($todayName): bool {
                    return in_array(
                        $todayName,
                        $this->normalizeDays(
                            $schedule->days
                        ),
                        true
                    );
                }
            )
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Today's class cards
        |--------------------------------------------------------------------------
        */

        $todayClasses = $todaySchedules
            ->map(function (Schedule $schedule) use ($today): array {
                $students = $this
                    ->getStudentsForSchedule(
                        $schedule
                    );

                $studentIds = $students
                    ->pluck('id');

                $attendances = Attendance::query()
                    ->where(
                        'schedule_id',
                        $schedule->id
                    )
                    ->whereIn(
                        'student_id',
                        $studentIds
                    )
                    ->where(function ($query) use ($today) {
                        $query
                            ->whereDate(
                                'attendance_date',
                                $today
                            )
                            ->orWhere(function ($query) use ($today) {
                                $query
                                    ->whereNull(
                                        'attendance_date'
                                    )
                                    ->whereDate(
                                        'created_at',
                                        $today
                                    );
                            });
                    })
                    ->orderByDesc('time_in')
                    ->orderByDesc('created_at')
                    ->get()
                    ->unique('student_id');

                $present = $attendances
                    ->filter(
                        fn ($attendance): bool => strtolower(
                            trim(
                                (string) $attendance->status
                            )
                        ) === 'present'
                    )
                    ->count();

                $late = $attendances
                    ->filter(
                        fn ($attendance): bool => strtolower(
                            trim(
                                (string) $attendance->status
                            )
                        ) === 'late'
                    )
                    ->count();

                return [
                    'id' => $schedule->id,

                    'className' => $schedule->subject,

                    'section' => $schedule->section
                            ?: 'No section',

                    'startTime' => $this->formatTime(
                        $schedule->start_time
                    ),

                    'endTime' => $this->formatTime(
                        $schedule->end_time
                    ),

                    'location' => $schedule->location
                            ?: 'No location',

                    'studentCount' => $students->count(),

                    'presentCount' => $present + $late,

                    'status' => $this->getDisplayStatus(
                        $schedule
                    ),

                    'registrationUrl' => $schedule->registration_token
                            ? route(
                                'student.class-registration.show',
                                [
                                    'token' => $schedule
                                        ->registration_token,
                                ]
                            )
                            : null,
                ];
            })
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Return instructor dashboard
        |--------------------------------------------------------------------------
        */

        return Inertia::render(
            'instructor/Dashboard',
            [
                'instructorStats' => [
                    'myClasses' => $schedules->count(),

                    'totalStudents' => $totalStudents,

                    'averageAttendance' => $averageAttendance,

                    'classesToday' => $todaySchedules->count(),
                ],

                'classAttendance' => $classAttendance,

                'todayClasses' => $todayClasses,
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Class Details
    |--------------------------------------------------------------------------
    */

    public function show(
        Request $request,
        Schedule $schedule
    ): Response {
        /*
        |--------------------------------------------------------------------------
        | Security / ownership
        |--------------------------------------------------------------------------
        */

        $instructorId =
            (int) $request->user()->id;

        $ownsSchedule =
            (int) $schedule->user_id === $instructorId ||
            (int) $schedule->instructor_id === $instructorId;

        abort_unless(
            $ownsSchedule,
            403,
            'You are not allowed to view this class.'
        );

        /*
        |--------------------------------------------------------------------------
        | Registered students only
        |--------------------------------------------------------------------------
        */

        $students = $this
            ->getStudentsForSchedule(
                $schedule
            );

        $studentIds = $students
            ->pluck('id');

        /*
        |--------------------------------------------------------------------------
        | Today's date
        |--------------------------------------------------------------------------
        */

        $today = now(
            'Asia/Manila'
        )->toDateString();

        /*
        |--------------------------------------------------------------------------
        | Today's attendance only
        |--------------------------------------------------------------------------
        */

        $attendanceRecords =
            Attendance::query()
                ->where(
                    'schedule_id',
                    $schedule->id
                )
                ->whereIn(
                    'student_id',
                    $studentIds
                )
                ->where(function ($query) use ($today) {
                    $query
                        ->whereDate(
                            'attendance_date',
                            $today
                        )
                        ->orWhere(function ($query) use ($today) {
                            $query
                                ->whereNull(
                                    'attendance_date'
                                )
                                ->whereDate(
                                    'created_at',
                                    $today
                                );
                        });
                })
                ->orderByDesc('time_in')
                ->orderByDesc('created_at')
                ->get()
                ->unique('student_id')
                ->keyBy('student_id');

        /*
        |--------------------------------------------------------------------------
        | Build student roster
        |--------------------------------------------------------------------------
        */

        $studentRoster = $students
            ->map(
                function (
                    User $student
                ) use (
                    $attendanceRecords
                ): array {
                    $attendance =
                        $attendanceRecords
                            ->get(
                                $student->id
                            );

                    $status = $attendance
                        ? strtolower(
                            trim(
                                (string)
                                $attendance->status
                            )
                        )
                        : 'absent';

                    if (
                        ! in_array(
                            $status,
                            [
                                'present',
                                'late',
                                'absent',
                            ],
                            true
                        )
                    ) {
                        $status = 'absent';
                    }

                    return [
                        'id' => $student->id,

                        'name' => $student->name,

                        'studentNumber' => $student->pivot?->student_number
                            ?: $student->student_id
                            ?: 'Not assigned',

                        'course' => $student->course,

                        'year' => $student->pivot?->year_level
                            ?: $student->year,

                        'section' => $student->pivot?->section
                            ?: $student->section,

                        'email' => $student->email,

                        'registeredAt' => $student->pivot?->registered_at
                                ? Carbon::parse(
                                    $student
                                        ->pivot
                                        ->registered_at
                                )
                                    ->timezone(
                                        'Asia/Manila'
                                    )
                                    ->format(
                                        'M d, Y h:i A'
                                    )
                                : null,

                        'registrationStatus' => $student->pivot?->status
                            ?: 'active',

                        'status' => ucfirst(
                            $status
                        ),

                        'timeIn' => $attendance?->time_in
                            ?->timezone(
                                'Asia/Manila'
                            )
                            ->format(
                                'h:i A'
                            ),
                    ];
                }
            )
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Statistics
        |--------------------------------------------------------------------------
        */

        $total =
            $studentRoster->count();

        $present =
            $studentRoster
                ->filter(
                    fn (
                        array $student
                    ): bool => strtolower(
                        (string)
                        $student['status']
                    ) === 'present'
                )
                ->count();

        $late =
            $studentRoster
                ->filter(
                    fn (
                        array $student
                    ): bool => strtolower(
                        (string)
                        $student['status']
                    ) === 'late'
                )
                ->count();

        $absent =
            $studentRoster
                ->filter(
                    fn (
                        array $student
                    ): bool => strtolower(
                        (string)
                        $student['status']
                    ) === 'absent'
                )
                ->count();

        /*
        |--------------------------------------------------------------------------
        | Class Details Page
        |--------------------------------------------------------------------------
        */

        return Inertia::render(
            'instructor/ClassDetails',
            [
                'classDetails' => [
                    'id' => $schedule->id,

                    'subject' => $schedule->subject,

                    'section' => $schedule->section,

                    'startTime' => $this->formatTime(
                        $schedule->start_time
                    ),

                    'endTime' => $this->formatTime(
                        $schedule->end_time
                    ),

                    'location' => $schedule->location,

                    'status' => $this->getDisplayStatus(
                        $schedule
                    ),

                    'registrationUrl' => $schedule->registration_token
                            ? route(
                                'student.class-registration.show',
                                [
                                    'token' => $schedule
                                        ->registration_token,
                                ]
                            )
                            : null,
                ],

                'students' => $studentRoster,

                'statistics' => [
                    'total' => $total,

                    'present' => $present,

                    'late' => $late,

                    'absent' => $absent,
                ],
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Registered Students Only
    |--------------------------------------------------------------------------
    */

    private function getStudentsForSchedule(
        Schedule $schedule
    ): Collection {
        return $schedule
            ->registeredStudents()

            /*
            |--------------------------------------------------------------------------
            | IMPORTANT FIX
            |--------------------------------------------------------------------------
            |
            | Both users and schedule_student now contain "status".
            |
            | Therefore we MUST explicitly use:
            |
            | users.status
            |
            | and:
            |
            | schedule_student.status
            |
            */

            ->where(
                'users.role',
                'student'
            )

            /*
            |--------------------------------------------------------------------------
            | Student Account Status
            |--------------------------------------------------------------------------
            */

            ->where(
                function ($query) {
                    $query
                        ->whereNull(
                            'users.status'
                        )
                        ->orWhereRaw(
                            'LOWER(users.status) != ?',
                            [
                                'inactive',
                            ]
                        );
                }
            )

            /*
            |--------------------------------------------------------------------------
            | Class Registration Status
            |--------------------------------------------------------------------------
            */

            ->where(
                function ($query) {
                    $query
                        ->whereNull(
                            'schedule_student.status'
                        )
                        ->orWhereRaw(
                            'LOWER(schedule_student.status) = ?',
                            [
                                'active',
                            ]
                        );
                }
            )

            ->orderBy(
                'users.name'
            )

            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize Days
    |--------------------------------------------------------------------------
    */

    private function normalizeDays(
        array|string|null $days
    ): array {
        if (! is_array($days)) {
            if (
                ! is_string($days) ||
                trim($days) === ''
            ) {
                return [];
            }

            $decoded = json_decode(
                $days,
                true
            );

            $days =
                is_array($decoded)
                    ? $decoded
                    : explode(
                        ',',
                        $days
                    );
        }

        $map = [
            'monday' => 'Mon',
            'mon' => 'Mon',
            'm' => 'Mon',

            'tuesday' => 'Tue',
            'tue' => 'Tue',
            'tues' => 'Tue',

            'wednesday' => 'Wed',
            'wed' => 'Wed',
            'w' => 'Wed',

            'thursday' => 'Thu',
            'thu' => 'Thu',
            'thur' => 'Thu',
            'thurs' => 'Thu',

            'friday' => 'Fri',
            'fri' => 'Fri',
            'f' => 'Fri',

            'saturday' => 'Sat',
            'sat' => 'Sat',

            'sunday' => 'Sun',
            'sun' => 'Sun',
        ];

        return collect($days)
            ->map(
                function (
                    $day
                ) use (
                    $map
                ) {
                    $key = strtolower(
                        trim(
                            (string) $day
                        )
                    );

                    return
                        $map[$key]
                        ?? null;
                }
            )
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    /*
    |--------------------------------------------------------------------------
    | Format Time
    |--------------------------------------------------------------------------
    */

    private function formatTime(
        ?string $time
    ): string {
        if (! $time) {
            return '';
        }

        try {
            return Carbon::parse(
                $time
            )->format(
                'h:i A'
            );
        } catch (\Throwable) {
            return (string) $time;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Display Status
    |--------------------------------------------------------------------------
    */

    private function getDisplayStatus(
        Schedule $schedule
    ): string {
        $todayName =
            now(
                'Asia/Manila'
            )->format('D');

        $scheduleDays =
            $this->normalizeDays(
                $schedule->days
            );

        if (
            ! in_array(
                $todayName,
                $scheduleDays,
                true
            )
        ) {
            return 'Upcoming';
        }

        if (
            ! $schedule->start_time ||
            ! $schedule->end_time
        ) {
            return 'Upcoming';
        }

        $now =
            now(
                'Asia/Manila'
            );

        try {
            $start =
                Carbon::parse(
                    $now
                        ->toDateString()
                    .' '.
                    $schedule
                        ->start_time,
                    'Asia/Manila'
                );

            $end =
                Carbon::parse(
                    $now
                        ->toDateString()
                    .' '.
                    $schedule
                        ->end_time,
                    'Asia/Manila'
                );
        } catch (\Throwable) {
            return 'Upcoming';
        }

        if ($now->lt($start)) {
            return 'Upcoming';
        }

        if ($now->gt($end)) {
            return 'Done';
        }

        return 'Ongoing';
    }
}
