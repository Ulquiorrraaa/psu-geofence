<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Services\AttendanceAutoService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentDashboardController extends Controller
{
    public function index(
        Request $request
    ): Response {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Philippine date/time
        |--------------------------------------------------------------------------
        */

        $now = now(config('app.timezone'));

        $today =
            $now->toDateString();

        $todayName =
            $now->format('D');

        $nowTime =
            $now->format('H:i:s');

        /*
        |--------------------------------------------------------------------------
        | Student registered classes
        |--------------------------------------------------------------------------
        */

        $registeredSchedules = $user
            ->registeredSchedules()
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Student section classes
        |--------------------------------------------------------------------------
        */

        $sectionSchedules = collect();

        if (
            $user->section !== null &&
            trim((string) $user->section) !== ''
        ) {
            $section =
                trim((string) $user->section);

            $sectionSchedules =
                Schedule::query()
                    ->where(function (
                        $query
                    ) use ($section) {
                        $query
                            ->whereRaw(
                                'LOWER(TRIM(section)) = ?',
                                [
                                    strtolower(
                                        $section
                                    ),
                                ]
                            )
                            ->orWhereNull(
                                'section'
                            );
                    })
                    ->get();
        }

        /*
        |--------------------------------------------------------------------------
        | All classes belonging to student
        |--------------------------------------------------------------------------
        */

        $studentSchedules =
            $registeredSchedules
                ->concat(
                    $sectionSchedules
                )
                ->unique('id')
                ->sortBy('start_time')
                ->values();

        /*
        |--------------------------------------------------------------------------
        | Schedule IDs
        |--------------------------------------------------------------------------
        */

        $studentScheduleIds =
            $studentSchedules
                ->pluck('id')
                ->values();

        /*
        |--------------------------------------------------------------------------
        | Today's classes
        |--------------------------------------------------------------------------
        */

        $todaySchedules =
            $studentSchedules
                ->filter(
                    function (
                        Schedule $schedule
                    ) use (
                        $todayName
                    ): bool {
                        $days =
                            $this
                                ->normalizeDays(
                                    $schedule->days
                                );

                        return in_array(
                            $todayName,
                            $days,
                            true
                        );
                    }
                )
                ->sortBy('start_time')
                ->values();

        /*
        |--------------------------------------------------------------------------
        | Current class
        |--------------------------------------------------------------------------
        */

        $attendanceService = app(AttendanceAutoService::class);
        $currentSchedule = $registeredSchedules
            ->filter(fn (Schedule $schedule) => in_array($schedule->status, ['Scheduled', 'Ongoing'], true)
                && $schedule->registeredStudents()->where('users.id', $user->id)->wherePivot('status', 'active')->exists())
            ->sortByDesc('recording')
            ->first(fn (Schedule $schedule) => $attendanceService->checkInSession($schedule, $now) !== null);
        $sessionDate = $currentSchedule
            ? $attendanceService->checkInSession($currentSchedule, $now)[0]
            : $today;

        /*
        |--------------------------------------------------------------------------
        | Attendance helper
        |--------------------------------------------------------------------------
        */

        $attendanceForPeriod =
            function (
                ?string $startDate = null,
                ?string $endDate = null
            ) use (
                $user,
                $studentScheduleIds
            ) {
                $query =
                    Attendance::query()
                        ->where(
                            'student_id',
                            $user->id
                        )
                        ->whereIn(
                            'schedule_id',
                            $studentScheduleIds
                        );

                if (
                    $startDate !== null &&
                    $endDate !== null
                ) {
                    $query->where(
                        function (
                            $query
                        ) use (
                            $startDate,
                            $endDate
                        ) {
                            $query
                                ->whereDate('attendance_date', '>=', $startDate)->whereDate('attendance_date', '<=', $endDate)
                                ->orWhere(
                                    function (
                                        $query
                                    ) use (
                                        $startDate,
                                        $endDate
                                    ) {
                                        $query
                                            ->whereNull(
                                                'attendance_date'
                                            )
                                            ->whereBetween(
                                                'created_at',
                                                [
                                                    $startDate.
                                                    ' 00:00:00',

                                                    $endDate.
                                                    ' 23:59:59',
                                                ]
                                            );
                                    }
                                );
                        }
                    );
                }

                return $query->get([
                    'id',
                    'status',
                    'attendance_date',
                    'created_at',
                ]);
            };

        /*
        |--------------------------------------------------------------------------
        | Attendance statistics
        |--------------------------------------------------------------------------
        */

        $weekRecords =
            $attendanceForPeriod(
                $now
                    ->copy()
                    ->startOfWeek(
                        Carbon::MONDAY
                    )
                    ->toDateString(),

                $today
            );

        $monthRecords =
            $attendanceForPeriod(
                $now
                    ->copy()
                    ->startOfMonth()
                    ->toDateString(),

                $today
            );

        $allRecords =
            $attendanceForPeriod();

        /*
        |--------------------------------------------------------------------------
        | Present counter
        |--------------------------------------------------------------------------
        */

        $countPresent =
            static function (
                $records
            ): int {
                return $records
                    ->filter(
                        function (
                            Attendance $record
                        ): bool {
                            $status =
                                strtolower(
                                    trim(
                                        (string)
                                        $record->status
                                    )
                                );

                            return
                                $status ===
                                    'present'
                                ||
                                $status ===
                                    'late'
                                ||
                                str_starts_with(
                                    $status,
                                    'present'
                                )
                                ||
                                str_starts_with(
                                    $status,
                                    'late'
                                );
                        }
                    )
                    ->count();
            };

        /*
        |--------------------------------------------------------------------------
        | Today's current attendance
        |--------------------------------------------------------------------------
        */

        $todayAttendance = null;

        if ($currentSchedule) {
            $todayAttendance =
                Attendance::query()
                    ->where(
                        'student_id',
                        $user->id
                    )
                    ->where(
                        'schedule_id',
                        $currentSchedule->id
                    )
                    ->where(
                        function (
                            $query
                        ) use ($sessionDate) {
                            $query
                                ->whereDate(
                                    'attendance_date',
                                    $sessionDate
                                )
                                ->orWhere(
                                    function (
                                        $query
                                    ) use ($sessionDate) {
                                        $query
                                            ->whereNull(
                                                'attendance_date'
                                            )
                                            ->whereDate(
                                                'created_at',
                                                $sessionDate
                                            );
                                    }
                                );
                        }
                    )
                    ->latest('time_in')
                    ->first();
        }

        /*
        |--------------------------------------------------------------------------
        | Coordinates
        |--------------------------------------------------------------------------
        */

        $latitude = null;
        $longitude = null;

        if (
            $currentSchedule &&
            $currentSchedule->coordinates
        ) {
            $coordinates =
                preg_split(
                    '/\s*,\s*/',
                    trim(
                        (string)
                        $currentSchedule->coordinates
                    )
                );

            if (
                isset($coordinates[0]) &&
                is_numeric(
                    $coordinates[0]
                )
            ) {
                $latitude =
                    (float)
                    $coordinates[0];
            }

            if (
                isset($coordinates[1]) &&
                is_numeric(
                    $coordinates[1]
                )
            ) {
                $longitude =
                    (float)
                    $coordinates[1];
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Radius
        |--------------------------------------------------------------------------
        */

        $radius = null;

        if (
            $currentSchedule &&
            $currentSchedule->radius !== null
        ) {
            $radiusValue =
                preg_replace(
                    '/[^0-9.]/',
                    '',
                    (string)
                    $currentSchedule->radius
                );

            if (
                is_numeric(
                    $radiusValue
                )
            ) {
                $radius =
                    (float)
                    $radiusValue;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Classes remaining today
        |--------------------------------------------------------------------------
        */

        $classesRemaining =
            $todaySchedules
                ->filter(
                    function (
                        Schedule $schedule
                    ) use (
                        $nowTime
                    ): bool {
                        return
                            $schedule->start_time &&
                            $schedule->start_time >
                                $nowTime;
                    }
                )
                ->count();

        /*
        |--------------------------------------------------------------------------
        | Class notifications
        |--------------------------------------------------------------------------
        */

        $classNotifications =
            $todaySchedules
                ->map(
                    function (
                        Schedule $schedule
                    ): array {
                        return [
                            'id' => $schedule->id,

                            'title' => 'You have a class today',

                            'message' => $schedule->subject.
                                ' is scheduled today.',

                            'subject' => $schedule->subject,

                            'time' => $schedule->start_time
                                    ? Carbon::parse(
                                        $schedule
                                            ->start_time
                                    )->format(
                                        'h:i A'
                                    )
                                    : null,

                            'location' => $schedule->location,
                        ];
                    }
                )
                ->values();

        /*
        |--------------------------------------------------------------------------
        | Dashboard response
        |--------------------------------------------------------------------------
        */

        return Inertia::render(
            'student/Dashboard',
            [
                'student' => [
                    'profile_picture_url' => $user->profile_picture_url,
                    'name' => $user->name,

                    'course' => $user->course,

                    'year' => $user->year,

                    'section' => $user->section,

                    'student_id' => $user->student_id,
                ],

                'attendanceStats' => [
                    'week_present' => $countPresent(
                        $weekRecords
                    ),

                    'week_total' => $weekRecords
                        ->count(),

                    'month_present' => $countPresent(
                        $monthRecords
                    ),

                    'month_total' => $monthRecords
                        ->count(),

                    'overall_percentage' => $allRecords
                        ->isNotEmpty()
                            ? round(
                                (
                                    $countPresent(
                                        $allRecords
                                    )
                                    /
                                    $allRecords
                                        ->count()
                                ) * 100
                            )
                            : null,

                    'classes_today' => $todaySchedules
                        ->count(),

                    'classes_remaining' => $classesRemaining,
                ],

                'currentClass' => $currentSchedule
                        ? [
                            'schedule_id' => $currentSchedule
                                ->id,

                            'subject_code' => null,

                            'subject_name' => $currentSchedule
                                ->subject,

                            'start_time' => $currentSchedule
                                ->start_time
                                ? Carbon::parse(
                                    $currentSchedule
                                        ->start_time
                                )->format(
                                    'H:i'
                                )
                                    : null,

                            'end_time' => $currentSchedule
                                ->end_time
                                ? Carbon::parse(
                                    $currentSchedule
                                        ->end_time
                                )->format(
                                    'H:i'
                                )
                                    : null,

                            'building' => $currentSchedule
                                ->location,

                            'room' => null,

                            'instructor' => $currentSchedule
                                ->instructor,

                            'recording' => $currentSchedule->recording,
                            'attendance_status' => $todayAttendance ? strtolower($todayAttendance->status) : null,
                            'check_in' => $todayAttendance
                                ?->time_in
                                ?->setTimezone(
                                    'Asia/Manila'
                                )
                                ->format(
                                    'H:i'
                                ),

                            'time_in_class' => null,

                            'geofence_latitude' => $latitude,

                            'geofence_longitude' => $longitude,

                            'geofence_radius_meters' => $radius ?? 50,
                        ]
                        : null,

                'location' => [
                    'latitude' => null,

                    'longitude' => null,

                    'tracking' => false,

                    'inside_geofence' => false,
                ],

                'classNotifications' => $classNotifications,
            ]
        );
    }

    /**
     * Normalize all possible schedule day formats.
     */
    private function normalizeDays(
        array|string|null $days
    ): array {
        if ($days === null) {
            return [];
        }

        if (! is_array($days)) {
            $decoded =
                json_decode(
                    $days,
                    true
                );

            if (is_array($decoded)) {
                $days = $decoded;
            } else {
                $days = explode(
                    ',',
                    $days
                );
            }
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
                ) use ($map) {
                    $key =
                        strtolower(
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
}
