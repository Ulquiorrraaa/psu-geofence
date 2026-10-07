# Automatic attendance upgrade: complete fixed code

The upgrade is saved in your existing project. All needed files were available locally.

## Cause

GPS already classified check-ins as Present/Late using a fixed grace period. Automatic absence processing and a scheduled command were missing. The weekly Attendance Sheet lives in CreateAttendance.tsx; it lacked schedule-day information and retained attendance only from its initial page load.

## Files and database

Modified: AttendanceController.php, StudentAttendanceCheckInController.php, StudentDashboardController.php, CreateAttendance.tsx, instructor/Attendance.tsx, student/Dashboard.tsx, routes/console.php.
Created: AttendanceAutoService.php, config/attendance.php, AutomaticAttendanceTest.php.

No migration is needed. The live database already has the unique schedule/student/date index, and no duplicate dated groups were found. Existing database enum values Present/Late/Absent are preserved. No routes, models, public/index.php, registration features, or unrelated local changes were replaced.

The attendance:process Artisan command uses the project's existing Laravel 13 routes/console.php structure; no separate command class is needed.

## Behavior and limits

Only schedule_student registrations are used. Automatic absences apply to active registrations and Scheduled/Ongoing classes. They do not depend on the instructor recording switch; GPS still respects that switch and the existing geofence and accuracy checks.

Default check-in opens 15 minutes early. Through start + 15 minutes is Present; later through the exact class end time is Late. Missing attendance becomes Absent strictly after end. Existing records are never overwritten by the processor. Non-class days and future dates create no automatic attendance. Overnight attendance uses the session's starting date and next-day end time. All timing uses config('app.timezone'), currently Asia/Manila.

The sheet keeps its layout, groups, filters, colors, and icons. It refreshes every 15 seconds, shows '-' for pending class days, and uses the neutral non-class style with a tooltip. Manual corrections update existing rows, including GPS rows. The manual cycle is Present -> Late -> Absent -> Present, avoiding deletion/recreation of automatic absences. Manual corrections clear GPS coordinates so corrected Present uses the Manual icon. No separate recording column or audit trail for Manual versus Automatic absences was added.

The scheduler catches up the previous seven calendar days by default. Sheet opening processes its displayed date range. Records are not generated before schedule creation or registration. Historical catch-up uses the current schedule and registration; the existing database has no historical versions of schedule days/times.

## Verification

16 attendance/GPS/deletion tests passed with 111 assertions, using an isolated SQLite in-memory database.
TypeScript, sheet ESLint, PHP formatting checks, and the production frontend build passed.
Wayfinder regeneration was excluded from the build.
schedule:list confirms attendance:process is scheduled every minute.
The Windows task CapstoneAutomaticAttendance is installed and has run successfully (LastTaskResult 0). It runs every minute while the current Windows user is signed in, including on battery power. Production processing was run and created 0 missing absences; eligible existing attendance was preserved.

## GPS follow-up fix

The student dashboard previously kept its initial current class, so a page opened before class could fail to submit GPS attendance when class began. It also excluded early and overnight attendance windows. The dashboard now polls every 10 seconds and uses AttendanceAutoService to choose an active registered session. It sends the real saved Present/Late status to the browser. The instructor list also refreshes every 15 seconds.

The 10 focused automatic attendance tests pass, including early/overnight dashboard selection and excluding unregistered classes. TypeScript, ESLint for both updated pages and the production build pass. The earlier 16-test attendance/GPS/deletion run passed before this follow-up; the new focused run did not repeat that entire suite.

Refresh both student dashboard and instructor attendance pages once. GPS must be enabled and permitted, with accurate location inside the geofence, during the attendance window, and instructor class recording enabled. An already-finished class cannot accept a normal GPS check-in. Existing manual Present/Late records are preserved.

## Complete fixed files

### C:/xampp/htdocs/capstone_system/app/Services/AttendanceAutoService.php

```php
<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Schedule;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;

class AttendanceAutoService
{
    public function days(Schedule $schedule): array
    {
        $aliases = ['m' => 'mon', 't' => 'tue', 'w' => 'wed', 'th' => 'thu', 'f' => 'fri'];

        return array_values(array_unique(array_filter(array_map(
            static fn ($day) => $aliases[strtolower(trim((string) $day))]
                ?? substr(strtolower(trim((string) $day)), 0, 3),
            $schedule->days ?? []
        ), static fn ($day) => in_array($day, ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], true))));
    }

    public function session(Schedule $schedule, string $date): ?array
    {
        $day = CarbonImmutable::parse($date, config('app.timezone'))->startOfDay();
        if (! in_array(strtolower($day->format('D')), $this->days($schedule), true)
            || ! $schedule->start_time || ! $schedule->end_time) {
            return null;
        }
        $start = CarbonImmutable::parse($date.' '.$schedule->start_time, config('app.timezone'));
        $end = CarbonImmutable::parse($date.' '.$schedule->end_time, config('app.timezone'));
        if ($end->lt($start)) {
            $end = $end->addDay();
        }

        return [$start, $end];
    }

    public function checkInSession(Schedule $schedule, CarbonInterface $now): ?array
    {
        foreach ([$now->copy()->subDay()->toDateString(), $now->toDateString()] as $date) {
            $session = $this->session($schedule, $date);
            if ($session && $now->gte($session[0]->subMinutes(config('attendance.early_minutes')))
                && $now->lte($session[1])) {
                return [$date, ...$session];
            }
        }

        return null;
    }

    public function process(?Builder $schedules = null, ?string $from = null, ?string $through = null): int
    {
        $now = CarbonImmutable::instance(now(config('app.timezone')));
        $fromDate = $from
            ? CarbonImmutable::parse($from, config('app.timezone'))->startOfDay()
            : $now->startOfDay()->subDays(config('attendance.lookback_days') - 1);
        $throughDate = $through
            ? CarbonImmutable::parse($through, config('app.timezone'))->startOfDay()->min($now->startOfDay())
            : $now->startOfDay();
        $created = 0;
        foreach (($schedules ?? Schedule::query())->whereIn('status', ['Scheduled', 'Ongoing'])->lazyById() as $schedule) {
            $created += $schedule->getConnection()->transaction(function () use ($schedule, $fromDate, $throughDate, $now): int {
                $locked = Schedule::whereKey($schedule->id)->lockForUpdate()->first();
                if (! $locked || ! in_array($locked->status, ['Scheduled', 'Ongoing'], true)) {
                    return 0;
                }
                $students = $locked->registeredStudents()->where('role', 'student')
                    ->wherePivot('status', 'active')->get();
                $count = 0;
                $firstDay = $locked->created_at
                    ? $fromDate->max(CarbonImmutable::instance($locked->created_at)->startOfDay())
                    : $fromDate;
                for ($day = $firstDay; $day->lte($throughDate); $day = $day->addDay()) {
                    $date = $day->toDateString();
                    $session = $this->session($locked, $date);
                    if (! $session || ! $now->gt($session[1])
                        || ($locked->created_at && $session[1]->lt($locked->created_at))) {
                        continue;
                    }
                    foreach ($students as $student) {
                        $registeredAt = $student->pivot->registered_at ?? $student->pivot->created_at;
                        if ($registeredAt && CarbonImmutable::parse($registeredAt, config('app.timezone'))->gt($session[1])) {
                            continue;
                        }
                        // Date casts may serialize midnight on SQLite; match the calendar date.
                        if (Attendance::where('student_id', $student->id)
                            ->where('schedule_id', $locked->id)
                            ->whereDate('attendance_date', $date)->exists()) {
                            continue;
                        }
                        $record = Attendance::firstOrCreate([
                            'student_id' => $student->id,
                            'schedule_id' => $locked->id,
                            'attendance_date' => $date,
                        ], ['status' => 'absent']);
                        $count += (int) $record->wasRecentlyCreated;
                    }
                }

                return $count;
            });
        }

        return $created;
    }
}
```

### C:/xampp/htdocs/capstone_system/config/attendance.php

```php
<?php

return [
    'grace_minutes' => max(0, (int) env('ATTENDANCE_GRACE_MINUTES', 15)),
    'early_minutes' => max(0, (int) env('ATTENDANCE_EARLY_MINUTES', 15)),
    'lookback_days' => max(2, (int) env('ATTENDANCE_LOOKBACK_DAYS', 7)),
];
```

### C:/xampp/htdocs/capstone_system/app/Http/Controllers/AttendanceController.php

```php
<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Services\AttendanceAutoService;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function adminIndex(): Response
    {
        return Inertia::render('admin/Attendance', [
            'instructorAttendanceRecords' => Attendance::with(['student', 'schedule'])->latest()->get()->map(fn ($record) => [
                'studentId' => $record->student?->student_id ?? (string) $record->student_id,
                'name' => $record->student?->name ?? 'Deleted student',
                'className' => $record->schedule?->subject ?? 'Deleted class',
                'time' => $record->time_in?->format('Y-m-d H:i') ?? '',
                'status' => ucfirst(strtolower($record->status)),
                'location' => $record->schedule?->location ?? '',
                'coordinates' => $record->latitude !== null ? $record->latitude.', '.$record->longitude : '',
            ]),
        ]);
    }

    public function index(Request $request): Response
    {
        app(AttendanceAutoService::class)->process(Schedule::where('user_id', $request->user()->id));

        return Inertia::render('instructor/Attendance', [
            'instructorAttendanceRecords' => Attendance::query()
                ->whereHas('schedule', fn ($query) => $query->where('user_id', $request->user()->id))
                ->with(['student', 'schedule'])->latest()->get()->map(fn (Attendance $record) => [
                    'id' => $record->id,
                    'studentId' => $record->student?->student_id ?? (string) $record->student_id,
                    'name' => $record->student?->name ?? 'Deleted student',
                    'className' => $record->schedule?->subject ?? 'Deleted class',
                    'time' => $record->time_in?->format('H:i') ?? '',
                    'status' => ucfirst(strtolower($record->status)),
                    'location' => $record->schedule?->location ?? '',
                    'coordinates' => $record->latitude !== null ? $record->latitude.', '.$record->longitude : '',
                ]),
        ]);
    }

    public function create(Request $request): Response
    {
        $validated = $request->validate([
            'sheet_start' => ['sometimes', 'date_format:Y-m-d'],
            'sheet_weeks' => ['sometimes', 'integer', 'min:1', 'max:12'],
        ]);
        $now = now(config('app.timezone'));
        $start = CarbonImmutable::parse($validated['sheet_start'] ?? $now->toDateString(), config('app.timezone'))->startOfWeek();
        $weeks = (int) ($validated['sheet_weeks'] ?? 4);
        $service = app(AttendanceAutoService::class);
        $service->process(Schedule::where('user_id', $request->user()->id), $start->toDateString(), $start->addWeeks($weeks)->subDay()->toDateString());
        $schedules = Schedule::where('user_id', $request->user()->id)
            ->with(['registeredStudents', 'attendances'])->get();
        $calendar = [];
        foreach ($schedules as $schedule) {
            for ($offset = 0; $offset < $weeks * 7; $offset++) {
                $date = $start->addDays($offset)->toDateString();
                $session = $service->session($schedule, $date);
                $calendar[$schedule->id][$date] = ! $session ? 'non_class'
                    : ($now->gt($session[1]) ? 'finished' : ($now->lt($session[0]) ? 'pending' : 'ongoing'));
            }
        }

        return Inertia::render('instructor/CreateAttendance', [
            'calendar' => $calendar,
            'today' => $now->toDateString(),
            'subjects' => $schedules->map(fn ($schedule) => ['id' => $schedule->id, 'name' => $schedule->subject]),
            'students' => $schedules->flatMap(fn ($schedule) => $schedule->registeredStudents->map(fn ($student) => [
                'id' => $student->id,
                'student_id' => $student->student_id ?? (string) $student->id,
                'name' => $student->name,
                'year' => $student->pivot->year_level ?? $student->year ?? '',
                'section' => $student->pivot->section ?? $student->section ?? '',
                'subject_id' => $schedule->id,
            ])),
            'attendance' => $schedules->flatMap(fn ($schedule) => $schedule->attendances->map(fn ($record) => [
                'student_id' => $record->student_id,
                'schedule_id' => $record->schedule_id,
                'date' => ($record->attendance_date ?? $record->created_at)->toDateString(),
                'status' => strtolower($record->status) === 'present'
                    ? ($record->latitude !== null ? 'present_gps' : 'present_manual')
                    : strtolower($record->status),
            ])),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'integer', 'exists:users,id'],
            'schedule_id' => ['required', 'integer', 'exists:schedules,id'],
            'attendance_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'status' => ['nullable', 'in:present,late,absent'],
        ]);
        $schedule = Schedule::findOrFail($validated['schedule_id']);
        abort_unless($schedule->user_id === $request->user()->id, 403);
        abort_unless($schedule->registeredStudents()->where('users.id', $validated['student_id'])->where('role', 'student')->exists(), 403);

        if (! app(AttendanceAutoService::class)->session($schedule, $validated['attendance_date'])) {
            throw ValidationException::withMessages(['attendance_date' => 'This is not a scheduled class day.']);
        }

        $schedule->getConnection()->transaction(function () use ($schedule, $validated): void {
            // Serialize writes for this class, including concurrent check-ins.
            Schedule::whereKey($schedule->id)->lockForUpdate()->first();
            $key = [
                'student_id' => $validated['student_id'],
                'schedule_id' => $schedule->id,
                'attendance_date' => $validated['attendance_date'],
            ];
            $existing = Attendance::where('student_id', $validated['student_id'])->where('schedule_id', $schedule->id)->whereDate('attendance_date', $validated['attendance_date'])->first();
            if ($validated['status'] === null) {
                $existing?->delete();
            } else {
                $record = $existing ?? new Attendance($key);
                $record->fill([
                    'status' => $validated['status'],
                    'latitude' => null,
                    'longitude' => null,
                    'time_out' => $validated['status'] === 'absent' ? null : $existing?->time_out,
                    'time_in' => $validated['status'] === 'absent' ? null : ($existing?->time_in ?? $validated['attendance_date'].' '.now()->format('H:i:s')),
                ])->save();
            }
        });

        return back()->with('success', 'Attendance saved successfully.');
    }

    public function destroy(Request $request, Attendance $attendance): RedirectResponse
    {
        abort_unless($attendance->schedule?->user_id === $request->user()->id, 403);
        $attendance->delete();

        return back()->with('success', 'Attendance record deleted successfully.');
    }
}
```

### C:/xampp/htdocs/capstone_system/app/Http/Controllers/StudentAttendanceCheckInController.php

```php
<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Services\AttendanceAutoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentAttendanceCheckInController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'schedule_id' => [
                'required',
                'integer',
                'exists:schedules,id',
            ],

            'latitude' => [
                'required',
                'numeric',
                'between:-90,90',
            ],

            // Optional for existing API clients; browser check-ins always send it.
            'accuracy' => ['sometimes', 'required', 'numeric', 'min:0', 'max:50'],

            'longitude' => [
                'required',
                'numeric',
                'between:-180,180',
            ],
        ]);

        $student = $request->user();
        abort_unless($student->role === 'student' && $student->status !== 'Inactive', 403);

        $schedule = Schedule::query()
            ->findOrFail(
                $validated['schedule_id']
            );

        /*
        |--------------------------------------------------------------------------
        | Make sure student is actually registered
        |--------------------------------------------------------------------------
        */

        $registered =
            $schedule
                ->registeredStudents()
                ->where(
                    'users.id',
                    $student->id
                )
                ->exists();

        if (! $registered) {
            return response()->json([
                'success' => false,
                'message' => 'You are not registered for this class.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Check class day
        |--------------------------------------------------------------------------
        */

        if (! $schedule->recording || ! in_array($schedule->status, ['Scheduled', 'Ongoing'], true)) {
            return response()->json(['success' => false, 'message' => 'Attendance recording is not active for this class.'], 422);
        }
        $now = now(config('app.timezone'));
        $session = app(AttendanceAutoService::class)->checkInSession($schedule, $now);
        if (! $session) {
            return response()->json([
                'success' => false,
                'message' => 'Check-in is only allowed during the scheduled attendance period.',
            ], 422);
        }
        [$attendanceDate, $classStart, $classEnd] = $session;

        /*
        |--------------------------------------------------------------------------
        | Classroom coordinates
        |--------------------------------------------------------------------------
        */

        if (! $schedule->coordinates) {
            return response()->json([
                'success' => false,
                'message' => 'This class has no classroom coordinates.',
            ], 422);
        }

        $coordinates =
            preg_split(
                '/\s*,\s*/',
                trim(
                    (string) $schedule->coordinates
                )
            );

        if (
            ! isset(
                $coordinates[0],
                $coordinates[1]
            ) ||
            ! is_numeric($coordinates[0]) ||
            ! is_numeric($coordinates[1]) || count($coordinates) !== 2 || abs((float) $coordinates[0]) > 90 || abs((float) $coordinates[1]) > 180
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid classroom coordinates.',
            ], 422);
        }

        $classLatitude =
            (float) $coordinates[0];

        $classLongitude =
            (float) $coordinates[1];

        /*
        |--------------------------------------------------------------------------
        | Radius
        |--------------------------------------------------------------------------
        */

        $radius =
            (float) preg_replace(
                '/[^0-9.]/',
                '',
                (string) (
                    $schedule->radius ?? 50
                )
            );

        if ($radius <= 0) {
            $radius = 50;
        }

        /*
        |--------------------------------------------------------------------------
        | Student location
        |--------------------------------------------------------------------------
        */

        $studentLatitude =
            (float) $validated['latitude'];

        $studentLongitude =
            (float) $validated['longitude'];

        /*
        |--------------------------------------------------------------------------
        | Calculate distance
        |--------------------------------------------------------------------------
        */

        $distance =
            $this->distanceInMeters(
                $studentLatitude,
                $studentLongitude,
                $classLatitude,
                $classLongitude
            );

        /*
        |--------------------------------------------------------------------------
        | Reject if outside geofence
        |--------------------------------------------------------------------------
        */

        if ($distance > $radius) {
            return response()->json([
                'success' => false,

                'inside_geofence' => false,

                'distance' => round($distance, 2),

                'radius' => $radius,

                'message' => 'You are outside the classroom geofence.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Determine present / late
        |--------------------------------------------------------------------------
        |
        | First 15 minutes after start = Present
        | More than 15 minutes after start = Late
        |
        */

        $lateAfter =
            $classStart
                ->copy()
                ->addMinutes(config('attendance.grace_minutes'));

        $status =
            $now->gt($lateAfter)
                ? 'late'
                : 'present';

        /*
        |--------------------------------------------------------------------------
        | Save attendance
        |--------------------------------------------------------------------------
        */

        $attendance = $schedule->getConnection()->transaction(function () use ($schedule, $student, $now, $attendanceDate, $status, $studentLatitude, $studentLongitude) {
            $lockedSchedule = Schedule::whereKey($schedule->id)->lockForUpdate()->firstOrFail();
            abort_unless($lockedSchedule->recording, 422, 'Attendance recording is not active for this class.');
            $key = [
                'student_id' => $student->id,
                'schedule_id' => $schedule->id,
                'attendance_date' => $attendanceDate,
            ];
            $existing = Attendance::where('student_id', $student->id)->where('schedule_id', $schedule->id)->whereDate('attendance_date', $attendanceDate)->first();
            if ($existing && in_array(strtolower($existing->status), ['present', 'late'], true)) {
                return $existing;
            }

            $record = $existing ?? new Attendance($key);
            $record->fill([
                'status' => $status,
                'time_in' => $now,
                'latitude' => $studentLatitude,
                'longitude' => $studentLongitude,
            ])->save();

            return $record;
        });

        return response()->json([
            'success' => true,

            'inside_geofence' => true,

            'status' => strtolower($attendance->status),

            'attendance_id' => $attendance->id,

            'time_in' => $attendance
                ->time_in
                ?->timezone(
                    config('app.timezone')
                )
                ->format('H:i'),

            'distance' => round($distance, 2),

            'message' => strtolower($attendance->status) === 'late'
                    ? 'Attendance recorded as late.'
                    : 'Attendance confirmed.',
        ]);
    }

    /**
     * Haversine distance.
     */
    private function distanceInMeters(
        float $lat1,
        float $lon1,
        float $lat2,
        float $lon2
    ): float {
        $earthRadius = 6371000;

        $latFrom =
            deg2rad($lat1);

        $lonFrom =
            deg2rad($lon1);

        $latTo =
            deg2rad($lat2);

        $lonTo =
            deg2rad($lon2);

        $latDelta =
            $latTo - $latFrom;

        $lonDelta =
            $lonTo - $lonFrom;

        $a =
            sin($latDelta / 2) ** 2 +
            cos($latFrom) *
            cos($latTo) *
            sin($lonDelta / 2) ** 2;

        $a = max(0.0, min(1.0, $a));

        $c =
            2 *
            atan2(
                sqrt($a),
                sqrt(1 - $a)
            );

        return $earthRadius * $c;
    }

    /**
     * Normalize schedule days.
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

            $days =
                is_array($decoded)
                    ? $decoded
                    : explode(',', $days);
        }

        $map = [
            'monday' => 'mon',
            'mon' => 'mon',
            'm' => 'mon',

            'tuesday' => 'tue',
            'tue' => 'tue',
            'tues' => 'tue',

            'wednesday' => 'wed',
            'wed' => 'wed',
            'w' => 'wed',

            'thursday' => 'thu',
            'thu' => 'thu',
            'thur' => 'thu',
            'thurs' => 'thu',

            'friday' => 'fri',
            'fri' => 'fri',
            'f' => 'fri',

            'saturday' => 'sat',
            'sat' => 'sat',

            'sunday' => 'sun',
            'sun' => 'sun',
        ];

        return collect($days)
            ->map(function ($day) use ($map) {
                $key =
                    strtolower(
                        trim(
                            (string) $day
                        )
                    );

                return $map[$key] ?? null;
            })
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
```

### C:/xampp/htdocs/capstone_system/app/Http/Controllers/StudentDashboardController.php

```php
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
```

### C:/xampp/htdocs/capstone_system/routes/console.php

```php
<?php

use App\Services\AttendanceAutoService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('attendance:process', function () {
    $count = app(AttendanceAutoService::class)->process();
    $this->info("Created {$count} automatic absence records.");
})->purpose('Record missing attendance for finished class sessions');

Schedule::command('attendance:process')
    ->everyMinute()
    ->withoutOverlapping();
```

### C:/xampp/htdocs/capstone_system/resources/js/pages/instructor/CreateAttendance.tsx

```tsx
import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
    Check,
    CheckCircle2,
    Clock3,
    Download,
    Filter,
    Minus,
    Settings,
    Wifi,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { csvCell } from '@/lib/csv';

type AttendanceStatus = 'present_gps' | 'present_manual' | 'late' | 'absent';

interface Student {
    id: number;
    student_id: string;
    name: string;
    year: string;
    section: string;
    subject_id?: number;
}

interface Subject {
    id: number;
    name: string;
}

interface AttendanceRecord {
    student_id: number;
    schedule_id: number;
    date: string;
    status: AttendanceStatus;
}

interface Props {
    students?: Student[];
    subjects?: Subject[];
    attendance?: AttendanceRecord[];
    today: string;
    calendar: Record<
        string,
        Record<string, 'non_class' | 'pending' | 'ongoing' | 'finished'>
    >;
}

interface DayData {
    day: string;
    date: Date;
    dateKey: string;
    displayDate: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Attendance({
    students = [],
    subjects = [],
    attendance = [],
    today,
    calendar,
}: Props) {
    /*
    |--------------------------------------------------------------------------
    | SETTINGS
    |--------------------------------------------------------------------------
    */

    const saving = useRef(false);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [saveError, setSaveError] = useState('');
    const [showSettings, setShowSettings] = useState(false);

    const [weeks, setWeeks] = useState(4);

    // Screenshot uses Monday-Saturday.
    const [daysPerWeek, setDaysPerWeek] = useState(6);

    const [startDate, setStartDate] = useState(() => today);

    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */

    const [selectedSubject, setSelectedSubject] = useState<string>(
        subjects.length > 0 ? String(subjects[0].id) : '',
    );

    const [selectedYear, setSelectedYear] = useState('');

    const [selectedSection, setSelectedSection] = useState('');

    /*
    |--------------------------------------------------------------------------
    | ATTENDANCE RECORDS
    |--------------------------------------------------------------------------
    */

    const records = useMemo(() => {
        const result: Record<string, AttendanceStatus> = {};
        attendance.forEach((item) => {
            result[item.schedule_id + '-' + item.student_id + '-' + item.date] =
                item.status;
        });

        return result;
    }, [attendance]);

    useEffect(() => {
        router.reload({
            data: { sheet_start: startDate, sheet_weeks: weeks },
            only: ['attendance', 'calendar', 'today'],
        });
        const poll = router.poll(15000, {
            data: { sheet_start: startDate, sheet_weeks: weeks },
            only: ['attendance', 'calendar', 'today'],
            onBefore: () => !saving.current,
        });

        return () => poll.stop();
    }, [startDate, weeks]);

    /*
    |--------------------------------------------------------------------------
    | NORMALIZED START DATE
    |--------------------------------------------------------------------------
    |
    | Whatever date is selected, the sheet starts on Monday.
    |
    */

    const normalizedStartDate = useMemo(() => {
        const date = new Date(`${startDate}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return new Date();
        }

        const currentDay = date.getDay();

        const difference = currentDay === 0 ? -6 : 1 - currentDay;

        const monday = new Date(date);

        monday.setDate(date.getDate() + difference);

        return monday;
    }, [startDate]);

    /*
    |--------------------------------------------------------------------------
    | GENERATED WEEKS
    |--------------------------------------------------------------------------
    */

    const generatedWeeks = useMemo<DayData[][]>(() => {
        return Array.from({ length: weeks }, (_, weekIndex) => {
            return Array.from({ length: daysPerWeek }, (_, dayIndex) => {
                const date = new Date(normalizedStartDate);

                date.setDate(
                    normalizedStartDate.getDate() + weekIndex * 7 + dayIndex,
                );

                return {
                    day: DAYS[dayIndex],
                    date,
                    dateKey: formatDateKey(date),
                    displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
                };
            });
        });
    }, [weeks, daysPerWeek, normalizedStartDate]);

    /*
    |--------------------------------------------------------------------------
    | YEARS
    |--------------------------------------------------------------------------
    */

    const years = useMemo(() => {
        return Array.from(
            new Set(students.map((student) => student.year).filter(Boolean)),
        );
    }, [students]);

    /*
    |--------------------------------------------------------------------------
    | SECTIONS
    |--------------------------------------------------------------------------
    */

    const sections = useMemo(() => {
        return Array.from(
            new Set(
                students
                    .filter((student) => {
                        if (!selectedYear) {
                            return true;
                        }

                        return student.year === selectedYear;
                    })
                    .map((student) => student.section)
                    .filter(Boolean),
            ),
        );
    }, [students, selectedYear]);

    /*
    |--------------------------------------------------------------------------
    | SELECTED SUBJECT
    |--------------------------------------------------------------------------
    */

    const activeSubject = useMemo(() => {
        if (!selectedSubject) {
            return null;
        }

        return subjects.find(
            (subject) => String(subject.id) === selectedSubject,
        );
    }, [subjects, selectedSubject]);

    /*
    |--------------------------------------------------------------------------
    | FILTERED STUDENTS
    |--------------------------------------------------------------------------
    */

    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const matchesYear = !selectedYear || student.year === selectedYear;

            const matchesSection =
                !selectedSection || student.section === selectedSection;

            /*
             * If your backend sends subject_id for students,
             * the subject filter will work automatically.
             *
             * If subject_id is not sent, all students remain visible.
             */
            const matchesSubject =
                !selectedSubject ||
                String(student.subject_id) === selectedSubject;

            return matchesYear && matchesSection && matchesSubject;
        });
    }, [students, selectedSubject, selectedYear, selectedSection]);

    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    const summary = useMemo(() => {
        let present = 0;
        let late = 0;
        let absent = 0;
        let gps = 0;

        /*
         * Only count attendance belonging to visible students.
         */
        const visibleStudentIds = new Set(
            filteredStudents.map((student) => student.id),
        );

        Object.entries(records).forEach(([recordKey, status]) => {
            const studentId = Number(recordKey.split('-')[1]);

            if (
                recordKey.split('-')[0] !== selectedSubject ||
                !visibleStudentIds.has(studentId)
            ) {
                return;
            }

            if (status === 'present_gps' || status === 'present_manual') {
                present++;
            }

            if (status === 'present_gps') {
                gps++;
            }

            if (status === 'late') {
                late++;
            }

            if (status === 'absent') {
                absent++;
            }
        });

        return {
            present,
            late,
            absent,
            gps,
        };
    }, [records, filteredStudents, selectedSubject]);

    /*
    |--------------------------------------------------------------------------
    | ATTENDANCE TOGGLE
    |--------------------------------------------------------------------------
    |
    | Empty
    | ↓
    | Present Manual
    | ↓
    | Late
    | ↓
    | Absent
    | ↓
    | Present Manual
    |
    | Instructors can correct GPS attendance.
    |
    */

    const toggleAttendance = (student: Student, date: string) => {
        const key = `${selectedSubject}-${student.id}-${date}`;

        if (
            saving.current ||
            !selectedSubject ||
            date > today ||
            calendar[selectedSubject]?.[date] === 'non_class'
        ) {
            return;
        }

        const current = records[key];

        let nextStatus: AttendanceStatus | null = null;

        if (!current) {
            nextStatus = 'present_manual';
        } else if (current === 'present_manual' || current === 'present_gps') {
            nextStatus = 'late';
        } else if (current === 'late') {
            nextStatus = 'absent';
        } else if (current === 'absent') {
            nextStatus = 'present_manual';
        }

        saving.current = true;
        setSavingKey(key);
        setSaveError('');
        router.post(
            '/attendance',
            {
                schedule_id: Number(selectedSubject),
                student_id: student.id,
                attendance_date: date,
                status:
                    nextStatus === 'present_manual' ? 'present' : nextStatus,
            },
            {
                preserveScroll: true,
                onError: (errors) =>
                    setSaveError(
                        Object.values(errors)[0] ??
                            'Attendance could not be saved.',
                    ),
                onFinish: () => {
                    saving.current = false;
                    setSavingKey(null);
                    router.reload({
                        data: { sheet_start: startDate, sheet_weeks: weeks },
                        only: ['attendance', 'calendar', 'today'],
                    });
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | SETTINGS PRESETS
    |--------------------------------------------------------------------------
    */

    const applyPreset = (presetWeeks: number, presetDays: number) => {
        setWeeks(presetWeeks);
        setDaysPerWeek(presetDays);
    };

    /*
    |--------------------------------------------------------------------------
    | EXPORT CSV
    |--------------------------------------------------------------------------
    */

    const exportAttendance = () => {
        const headers = ['Student ID', 'Name', 'Year', 'Section'];

        generatedWeeks.forEach((week, weekIndex) => {
            week.forEach((day) => {
                headers.push(
                    `Week ${weekIndex + 1} ${day.day} ${day.displayDate}`,
                );
            });
        });

        const rows = filteredStudents.map((student) => {
            const row: Array<string | number> = [
                student.student_id,
                student.name,
                student.year,
                student.section,
            ];

            generatedWeeks.forEach((week) => {
                week.forEach((day) => {
                    const status =
                        records[
                            `${selectedSubject}-${student.id}-${day.dateKey}`
                        ];

                    row.push(
                        calendar[selectedSubject]?.[day.dateKey] === 'non_class'
                            ? 'Non-class day'
                            : attendanceText(status),
                    );
                });
            });

            return row;
        });

        const csv = [headers, ...rows]
            .map((row) => row.map(csvCell).join(','))
            .join('\n');

        const blob = new Blob([csv], {
            type: 'text/csv;charset=utf-8;',
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;
        link.download = 'attendance-sheet.csv';

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    return (
        <>
            {saveError && (
                <p role="alert" className="p-4 text-red-700">
                    {saveError}
                </p>
            )}
            <Head title="Attendance Sheet" />

            <div className="min-h-screen bg-[#f5f6f8] text-slate-900">
                {/* =====================================================
                    TOP GPS BAR
                ====================================================== */}

                <div className="sticky top-0 z-40 flex h-[58px] items-center justify-end border-b border-gray-200 bg-white px-7 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        GPS Tracking Active
                    </div>
                </div>

                {/* =====================================================
                    MAIN CONTENT
                ====================================================== */}

                <main className="px-4 pt-4 pb-8 sm:px-6 lg:px-7">
                    {/* =================================================
                        PAGE HEADER
                    ================================================== */}

                    <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <h1 className="text-[29px] font-bold tracking-tight text-[#970027]">
                                Attendance Sheet
                            </h1>

                            <p className="mt-1 text-[17px] text-slate-700">
                                Mark and track student attendance by week
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowSettings((current) => !current)
                                }
                                className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-gray-50"
                            >
                                <Settings size={18} />
                                Settings
                            </button>

                            <button
                                type="button"
                                onClick={exportAttendance}
                                className="flex h-11 items-center gap-2 rounded-xl bg-[#970027] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#7f001f]"
                            >
                                <Download size={18} />
                                Export to Excel
                            </button>
                        </div>
                    </div>

                    {/* =================================================
                        SETTINGS PANEL
                    ================================================== */}

                    {showSettings && (
                        <section className="mb-5 rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Settings
                                        size={21}
                                        className="text-[#970027]"
                                    />

                                    <div>
                                        <h2 className="font-bold text-slate-900">
                                            Sheet Configuration
                                        </h2>

                                        <p className="text-sm text-slate-500">
                                            Configure attendance weeks and class
                                            days.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowSettings(false)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-gray-100"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid gap-5 md:grid-cols-3">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Number of Weeks
                                    </label>

                                    <div className="flex h-11 items-center overflow-hidden rounded-xl border border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setWeeks((value) =>
                                                    Math.max(1, value - 1),
                                                )
                                            }
                                            className="flex h-full w-12 items-center justify-center bg-gray-50 hover:bg-gray-100"
                                        >
                                            <Minus size={18} />
                                        </button>

                                        <div className="flex flex-1 items-center justify-center font-semibold">
                                            {weeks}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setWeeks((value) =>
                                                    Math.min(12, value + 1),
                                                )
                                            }
                                            className="flex h-full w-12 items-center justify-center bg-gray-50 text-xl hover:bg-gray-100"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Days Per Week
                                    </label>

                                    <select
                                        value={daysPerWeek}
                                        onChange={(event) =>
                                            setDaysPerWeek(
                                                Number(event.target.value),
                                            )
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 outline-none focus:border-[#970027]"
                                    >
                                        <option value={5}>
                                            5 Days - Mon to Fri
                                        </option>

                                        <option value={6}>
                                            6 Days - Mon to Sat
                                        </option>

                                        <option value={7}>
                                            7 Days - Mon to Sun
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Start Date
                                    </label>

                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(event) =>
                                            setStartDate(event.target.value)
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 outline-none focus:border-[#970027]"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 border-t border-gray-100 pt-4">
                                <p className="mb-3 text-sm font-semibold text-slate-700">
                                    Quick Presets
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    <PresetButton
                                        text="4w × 5d"
                                        onClick={() => applyPreset(4, 5)}
                                    />

                                    <PresetButton
                                        text="4w × 6d"
                                        onClick={() => applyPreset(4, 6)}
                                    />

                                    <PresetButton
                                        text="8w × 6d"
                                        onClick={() => applyPreset(8, 6)}
                                    />

                                    <PresetButton
                                        text="12w × 6d"
                                        onClick={() => applyPreset(12, 6)}
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* =================================================
                        FILTER CARD
                    ================================================== */}

                    <section className="mb-5 rounded-[20px] border border-gray-200 bg-white px-5 py-3 shadow-sm">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff2f5]">
                                    <Filter
                                        size={19}
                                        className="text-[#970027]"
                                    />
                                </span>

                                <span className="uppercase">Filters</span>
                            </div>

                            {/* SUBJECT */}

                            <select
                                value={selectedSubject}
                                onChange={(event) =>
                                    setSelectedSubject(event.target.value)
                                }
                                className="h-12 min-w-[250px] flex-1 rounded-[16px] border border-gray-200 bg-[#fafafa] px-4 text-[16px] text-slate-900 transition outline-none focus:border-[#c98796] focus:ring-2 focus:ring-[#970027]/15 lg:max-w-[350px]"
                            >
                                {subjects.length === 0 && (
                                    <option value="">All Classes</option>
                                )}

                                {subjects.map((subject) => (
                                    <option
                                        key={subject.id}
                                        value={String(subject.id)}
                                    >
                                        {subject.name}
                                    </option>
                                ))}
                            </select>

                            {/* YEAR */}

                            <select
                                value={selectedYear}
                                onChange={(event) => {
                                    setSelectedYear(event.target.value);

                                    setSelectedSection('');
                                }}
                                className="h-12 min-w-[150px] rounded-[16px] border border-gray-200 bg-[#fafafa] px-4 text-[16px] text-slate-900 transition outline-none focus:border-[#c98796] focus:ring-2 focus:ring-[#970027]/15"
                            >
                                <option value="">All Years</option>

                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>

                            {/* SECTION */}

                            <select
                                value={selectedSection}
                                onChange={(event) =>
                                    setSelectedSection(event.target.value)
                                }
                                className="h-12 min-w-[150px] rounded-[16px] border border-gray-200 bg-[#fafafa] px-4 text-[16px] text-slate-900 transition outline-none focus:border-[#c98796] focus:ring-2 focus:ring-[#970027]/15"
                            >
                                <option value="">All Sections</option>

                                {sections.map((section) => (
                                    <option key={section} value={section}>
                                        {section}
                                    </option>
                                ))}
                            </select>

                            {/* DATE INFO */}

                            <div className="ml-auto flex items-center gap-3 text-sm whitespace-nowrap text-gray-500">
                                <CalendarDays
                                    size={18}
                                    className="text-[#970027]"
                                />

                                <span>
                                    {normalizedStartDate.toLocaleString(
                                        'en-US',
                                        {
                                            month: 'long',
                                            year: 'numeric',
                                        },
                                    )}
                                </span>

                                <span className="rounded-full border border-[#efbec8] bg-[#fff6f8] px-3 py-1.5 font-semibold text-[#970027]">
                                    {weeks}w × {daysPerWeek}d
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* =================================================
                        LEGEND
                    ================================================== */}

                    <section className="mb-6 rounded-[20px] border border-gray-200 bg-white px-6 py-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
                            <span className="text-sm font-medium text-gray-400 uppercase">
                                Legend
                            </span>

                            <Legend type="gps" text="Present (GPS)" />

                            <Legend type="manual" text="Present (Manual)" />

                            <Legend type="late" text="Late" />

                            <Legend type="absent" text="Absent" />

                            <div className="ml-auto flex items-center gap-2 text-sm text-gray-400">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                                    <Minus size={13} />
                                </span>
                                Non-class day
                            </div>
                        </div>
                    </section>

                    {/* =================================================
                        ATTENDANCE TABLE
                    ================================================== */}

                    <section className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-max min-w-full border-collapse">
                                <thead>
                                    {/* WEEK ROW */}

                                    <tr className="bg-[#970027] text-white">
                                        <th className="sticky left-0 z-30 w-[330px] min-w-[330px] border-r border-white/15 bg-[#970027] px-5 py-4 text-left">
                                            <div className="text-[16px] font-bold">
                                                Student
                                            </div>

                                            <div className="mt-1 text-[12px] font-normal text-white/70">
                                                {activeSubject?.name ??
                                                    'All Classes'}
                                            </div>
                                        </th>

                                        {generatedWeeks.map(
                                            (week, weekIndex) => (
                                                <th
                                                    key={weekIndex}
                                                    colSpan={week.length}
                                                    className="border-r border-white/10 px-3 py-4 text-center text-[14px] font-bold last:border-r-0"
                                                >
                                                    Week {weekIndex + 1}
                                                </th>
                                            ),
                                        )}
                                    </tr>

                                    {/* DAY ROW */}

                                    <tr className="bg-[#89001f] text-white">
                                        <th className="sticky left-0 z-30 min-w-[330px] border-r border-white/10 bg-[#89001f] px-5 py-3 text-left text-[12px] font-semibold text-white/75 uppercase">
                                            Student ID
                                        </th>

                                        {generatedWeeks.flatMap(
                                            (week, weekIndex) =>
                                                week.map((day) => (
                                                    <th
                                                        key={`${weekIndex}-${day.dateKey}`}
                                                        className="h-[55px] min-w-[58px] border-r border-white/10 px-2 text-center"
                                                    >
                                                        <div className="text-[12px] font-semibold">
                                                            {day.day}
                                                        </div>

                                                        <div className="text-[11px] font-medium text-white/55">
                                                            {day.displayDate}
                                                        </div>
                                                    </th>
                                                )),
                                        )}
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    weeks * daysPerWeek + 1
                                                }
                                                className="px-6 py-16 text-center"
                                            >
                                                <div className="text-lg font-semibold text-slate-700">
                                                    No students found
                                                </div>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    No students match the
                                                    selected filters.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <tr
                                                key={`${student.subject_id}-${student.id}`}
                                                className="border-b border-gray-100 last:border-b-0"
                                            >
                                                {/* STUDENT */}

                                                <td className="sticky left-0 z-20 min-w-[330px] border-r border-gray-200 bg-white px-5 py-[17px]">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff3f5] text-sm font-bold text-[#970027]">
                                                            {student.name
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="truncate text-[16px] font-semibold text-black">
                                                                {student.name}
                                                            </div>

                                                            <div className="mt-0.5 text-[11px] text-gray-400 italic">
                                                                {
                                                                    student.student_id
                                                                }
                                                            </div>

                                                            <div className="mt-2 flex gap-2">
                                                                <span className="rounded bg-gray-100 px-2 py-1 text-[10px] text-gray-500">
                                                                    {
                                                                        student.year
                                                                    }
                                                                </span>

                                                                <span className="rounded bg-[#fff2f5] px-2 py-1 text-[10px] font-medium text-[#970027]">
                                                                    {
                                                                        student.section
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* ATTENDANCE DAYS */}

                                                {generatedWeeks.flatMap(
                                                    (week) =>
                                                        week.map((day) => {
                                                            const key = `${selectedSubject}-${student.id}-${day.dateKey}`;

                                                            const status =
                                                                records[key];

                                                            return (
                                                                <td
                                                                    key={key}
                                                                    className="h-[104px] min-w-[58px] border-r border-gray-100 bg-[#fcfcfd] px-1 text-center"
                                                                >
                                                                    <button
                                                                        disabled={
                                                                            savingKey !==
                                                                                null ||
                                                                            day.dateKey >
                                                                                today ||
                                                                            calendar[
                                                                                selectedSubject
                                                                            ]?.[
                                                                                day
                                                                                    .dateKey
                                                                            ] ===
                                                                                'non_class'
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            toggleAttendance(
                                                                                student,
                                                                                day.dateKey,
                                                                            )
                                                                        }
                                                                        title={
                                                                            status ===
                                                                            'present_gps'
                                                                                ? 'Click to correct GPS attendance'
                                                                                : 'Click to change attendance'
                                                                        }
                                                                        className="group mx-auto flex h-full w-full items-center justify-center transition hover:bg-[#fff7f9]"
                                                                    >
                                                                        <AttendanceCell
                                                                            nonClass={
                                                                                calendar[
                                                                                    selectedSubject
                                                                                ]?.[
                                                                                    day
                                                                                        .dateKey
                                                                                ] ===
                                                                                'non_class'
                                                                            }
                                                                            status={
                                                                                status
                                                                            }
                                                                        />
                                                                    </button>
                                                                </td>
                                                            );
                                                        }),
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* =================================================
                        SUMMARY
                    ================================================== */}

                    <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            value={summary.present}
                            label="Present"
                            type="present"
                        />

                        <SummaryCard
                            value={summary.late}
                            label="Late"
                            type="late"
                        />

                        <SummaryCard
                            value={summary.absent}
                            label="Absent"
                            type="absent"
                        />

                        <SummaryCard
                            value={summary.gps}
                            label="GPS Recorded"
                            type="gps"
                        />
                    </section>
                </main>
            </div>
        </>
    );
}

/*
|--------------------------------------------------------------------------
| PRESET BUTTON
|--------------------------------------------------------------------------
*/

function PresetButton({
    text,
    onClick,
}: {
    text: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#970027]/30 hover:bg-[#fff4f6] hover:text-[#970027]"
        >
            {text}
        </button>
    );
}

/*
|--------------------------------------------------------------------------
| LEGEND
|--------------------------------------------------------------------------
*/

function Legend({
    type,
    text,
}: {
    type: 'gps' | 'manual' | 'late' | 'absent';
    text: string;
}) {
    return (
        <div className="flex items-center gap-2 text-[13px] text-gray-500">
            {type === 'gps' && (
                <CheckCircle2
                    size={18}
                    strokeWidth={2}
                    className="text-emerald-500"
                />
            )}

            {type === 'manual' && (
                <Check
                    size={18}
                    strokeWidth={2.5}
                    className="text-emerald-400"
                />
            )}

            {type === 'late' && (
                <Clock3 size={18} strokeWidth={2} className="text-amber-500" />
            )}

            {type === 'absent' && (
                <XCircle size={18} strokeWidth={2} className="text-red-500" />
            )}

            <span>{text}</span>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| ATTENDANCE CELL
|--------------------------------------------------------------------------
*/

function AttendanceCell({
    status,
    nonClass,
}: {
    status?: AttendanceStatus;
    nonClass?: boolean;
}) {
    if (nonClass) {
        return (
            <div
                title="Non-class day"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-xs text-gray-300"
            >
                ·
            </div>
        );
    }

    if (status === 'present_gps') {
        return (
            <div className="h-40px w-40px relative flex h-10 w-10 items-center justify-center rounded-[15px] border border-emerald-200 bg-emerald-50 text-[13px] font-bold text-emerald-700">
                P
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#970027]" />
            </div>
        );
    }

    if (status === 'present_manual') {
        return (
            <div className="flex h-10 w-10 items-center justify-center rounded-[15px] border border-emerald-200 bg-emerald-50 text-[13px] font-bold text-emerald-700">
                P
            </div>
        );
    }

    if (status === 'late') {
        return (
            <div className="flex h-10 w-10 items-center justify-center rounded-[15px] border border-amber-200 bg-amber-50 text-[13px] font-bold text-amber-700">
                L
            </div>
        );
    }

    if (status === 'absent') {
        return (
            <div className="flex h-10 w-10 items-center justify-center rounded-[15px] border border-red-200 bg-red-50 text-[13px] font-bold text-red-600">
                A
            </div>
        );
    }

    return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-xs text-gray-300">
            -
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| SUMMARY CARD
|--------------------------------------------------------------------------
*/

function SummaryCard({
    value,
    label,
    type,
}: {
    value: number;
    label: string;
    type: 'present' | 'late' | 'absent' | 'gps';
}) {
    const renderIcon = () => {
        if (type === 'present') {
            return <CheckCircle2 size={24} className="text-emerald-500" />;
        }

        if (type === 'late') {
            return <Clock3 size={24} className="text-amber-500" />;
        }

        if (type === 'absent') {
            return <XCircle size={24} className="text-red-500" />;
        }

        return <Wifi size={24} className="text-[#970027]" />;
    };

    const iconStyle =
        type === 'present'
            ? 'border-emerald-200 bg-emerald-50'
            : type === 'late'
              ? 'border-amber-200 bg-amber-50'
              : type === 'absent'
                ? 'border-red-200 bg-red-50'
                : 'border-[#edc1cb] bg-[#fff3f6]';

    const valueStyle =
        type === 'present'
            ? 'text-emerald-700'
            : type === 'late'
              ? 'text-amber-700'
              : type === 'absent'
                ? 'text-red-600'
                : 'text-[#970027]';

    return (
        <div className="flex min-h-[112px] items-center gap-5 rounded-[18px] border border-gray-200 bg-white px-6 shadow-sm">
            <div
                className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[15px] border ${iconStyle}`}
            >
                {renderIcon()}
            </div>

            <div>
                <div
                    className={`text-[30px] leading-none font-bold ${valueStyle}`}
                >
                    {value}
                </div>

                <div className="mt-2 text-sm text-gray-500">{label}</div>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| ATTENDANCE TEXT FOR EXPORT
|--------------------------------------------------------------------------
*/

function attendanceText(status?: AttendanceStatus) {
    switch (status) {
        case 'present_gps':
            return 'Present - GPS';

        case 'present_manual':
            return 'Present - Manual';

        case 'late':
            return 'Late';

        case 'absent':
            return 'Absent';

        default:
            return '';
    }
}

/*
|--------------------------------------------------------------------------
| FORMAT DATE
|--------------------------------------------------------------------------
*/

function formatDateKey(date: Date) {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
```

### C:/xampp/htdocs/capstone_system/resources/js/pages/instructor/Attendance.tsx

```tsx
import { Head, router, usePage, usePoll } from '@inertiajs/react';
import { Clock, Download, Filter, MapPin, Search, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { csvCell } from '@/lib/csv';

type Status = 'Present' | 'Absent' | 'Late';

type AttendanceRecord = {
    id: number;
    studentId: string;
    name: string;
    className: string;
    time: string;
    status: Status;
    location: string;
    coordinates: string;
};

type PageProps = {
    instructorAttendanceRecords?: AttendanceRecord[];
};

export default function Attendance() {
    usePoll(15000, { only: ['instructorAttendanceRecords'] });

    const { instructorAttendanceRecords = [] } = usePage().props as PageProps;

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'All Status' | Status>('All Status');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleteFeedback, setDeleteFeedback] = useState('');
    const deletionInProgress = useRef(false);

    const filteredRecords = useMemo(() => {
        return instructorAttendanceRecords.filter((record) => {
            const keyword = search.toLowerCase();

            const matchesSearch =
                record.studentId.toLowerCase().includes(keyword) ||
                record.name.toLowerCase().includes(keyword) ||
                record.className.toLowerCase().includes(keyword);

            const matchesStatus =
                status === 'All Status' || record.status === status;

            return matchesSearch && matchesStatus;
        });
    }, [instructorAttendanceRecords, search, status]);

    const total = instructorAttendanceRecords.length;

    const present = instructorAttendanceRecords.filter(
        (record) => record.status === 'Present',
    ).length;

    const absent = instructorAttendanceRecords.filter(
        (record) => record.status === 'Absent',
    ).length;

    const late = instructorAttendanceRecords.filter(
        (record) => record.status === 'Late',
    ).length;

    function handleDelete(attendanceId: number) {
        if (
            deletionInProgress.current ||
            !window.confirm(
                'Are you sure you want to delete this attendance record?',
            )
        ) {
            return;
        }

        deletionInProgress.current = true;
        setDeletingId(attendanceId);
        setDeleteFeedback('');

        router.delete(`/attendance/${attendanceId}`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setDeleteFeedback('Attendance record deleted successfully.');
            },
            onError: () => {
                setDeleteFeedback(
                    'Unable to delete this attendance record. Please try again.',
                );
            },
            onFinish: () => {
                deletionInProgress.current = false;
                setDeletingId(null);
            },
        });
    }

    function exportData() {
        const headers = [
            'Student ID',
            'Name',
            'Class',
            'Time',
            'Status',
            'Location',
            'Coordinates',
        ];

        const rows = filteredRecords.map((record) => [
            record.studentId,
            record.name,
            record.className,
            record.time,
            record.status,
            record.location,
            record.coordinates,
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map(csvCell).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'instructor-attendance-data.csv';
        link.click();

        URL.revokeObjectURL(url);
    }

    return (
        <>
            <Head title="Class Attendance" />

            <div className="min-h-screen bg-[#f7f8fa] p-5 text-gray-900 sm:p-7">
                <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#8f001f]">
                            Class Attendance
                        </h1>

                        <p className="mt-1 text-base text-gray-600">
                            Monitor student attendance for your classes
                        </p>
                    </div>

                    <button
                        onClick={exportData}
                        className="flex items-center justify-center gap-2 rounded-lg bg-[#970027] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#790020]"
                    >
                        <Download size={20} />
                        Export Data
                    </button>
                </div>

                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="relative flex-1">
                            <Search
                                className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500"
                                size={22}
                            />

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, ID, or class..."
                                className="w-full rounded-lg border border-gray-300 px-11 py-3 text-base text-gray-900 outline-none focus:border-[#970027]"
                            />
                        </div>

                        <Filter className="text-gray-500" size={24} />

                        <select
                            value={status}
                            onChange={(e) =>
                                setStatus(
                                    e.target.value as 'All Status' | Status,
                                )
                            }
                            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-[#970027]"
                        >
                            <option>All Status</option>
                            <option>Present</option>
                            <option>Absent</option>
                            <option>Late</option>
                        </select>
                    </div>
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="Total Students" value={total} />
                    <StatCard
                        title="Present"
                        value={present}
                        color="text-green-600"
                    />
                    <StatCard
                        title="Absent"
                        value={absent}
                        color="text-red-600"
                    />
                    <StatCard title="Late" value={late} color="text-gray-700" />
                </div>

                {deleteFeedback && (
                    <p
                        role="status"
                        className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700"
                    >
                        {deleteFeedback}
                    </p>
                )}

                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm">
                    <table className="w-full min-w-[900px] table-fixed text-left">
                        <thead className="bg-gray-50 text-sm font-bold tracking-wide text-gray-600 uppercase">
                            <tr>
                                <th className="w-[12%] px-6 py-5">
                                    Student ID
                                </th>
                                <th className="w-[16%] px-6 py-5">Name</th>
                                <th className="w-[18%] px-6 py-5">Class</th>
                                <th className="w-[14%] px-6 py-5">Time</th>
                                <th className="w-[12%] px-6 py-5">Status</th>
                                <th className="w-[18%] px-6 py-5">Location</th>
                                <th className="w-[10%] px-4 py-5">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className="border-t">
                                        <td className="px-6 py-6 font-bold text-gray-950">
                                            {record.studentId}
                                        </td>

                                        <td className="px-6 py-6 text-gray-950">
                                            {record.name}
                                        </td>

                                        <td className="px-6 py-6 text-gray-800">
                                            {record.className}
                                        </td>

                                        <td className="px-6 py-6 text-gray-800">
                                            <div className="flex items-center gap-2">
                                                <Clock
                                                    size={18}
                                                    className="text-gray-500"
                                                />
                                                {record.time || '--'}
                                            </div>
                                        </td>

                                        <td className="px-6 py-6">
                                            <span
                                                className={`rounded-full px-4 py-2 text-sm font-bold ${
                                                    record.status === 'Present'
                                                        ? 'bg-green-100 text-green-700'
                                                        : record.status ===
                                                            'Absent'
                                                          ? 'bg-red-100 text-red-700'
                                                          : 'bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                {record.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-6 text-gray-800">
                                            <div className="flex items-start gap-2">
                                                <MapPin
                                                    size={18}
                                                    className="mt-1 text-gray-500"
                                                />
                                                <div>
                                                    <p>
                                                        {record.location ||
                                                            'Not detected'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {record.coordinates ||
                                                            '--'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(record.id)
                                                }
                                                disabled={
                                                    deletingId === record.id
                                                }
                                                aria-label={`Delete attendance record for ${record.name}`}
                                                title="Delete attendance record"
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#970027] transition hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-8 py-16 text-center text-gray-500"
                                    >
                                        No attendance records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

function StatCard({
    title,
    value,
    color = 'text-gray-950',
}: {
    title: string;
    value: number;
    color?: string;
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-gray-900 shadow-sm">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <h2 className={`mt-2 text-3xl font-bold ${color}`}>{value}</h2>
        </div>
    );
}
```

### C:/xampp/htdocs/capstone_system/resources/js/pages/student/Dashboard.tsx

```tsx
import { Head, Link, usePoll } from '@inertiajs/react';

import {
    Activity,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock3,
    GraduationCap,
    MapPin,
    QrCode,
    Radio,
    TrendingUp,
    UserRound,
} from 'lucide-react';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLiveLocation } from '@/hooks/use-live-location';

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type Student = {
    name?: string | null;
    course?: string | null;
    section?: string | null;
    student_id?: string | null;
};

type AttendanceStats = {
    week_present?: number;
    week_total?: number;

    month_present?: number;
    month_total?: number;

    overall_percentage?: number;

    classes_today?: number;
    classes_remaining?: number;
};

type CurrentClass = {
    schedule_id?: number | null;

    subject_code?: string | null;
    subject_name?: string | null;

    start_time?: string | null;
    end_time?: string | null;

    building?: string | null;
    room?: string | null;

    instructor?: string | null;

    check_in?: string | null;
    recording?: boolean;
    attendance_status?: string | null;
    time_in_class?: string | null;

    geofence_latitude?: number | null;
    geofence_longitude?: number | null;
    geofence_radius_meters?: number | null;
};

type StudentDashboardProps = {
    student?: Student | null;

    attendanceStats?: AttendanceStats | null;

    currentClass?: CurrentClass | null;
};

type CheckInResponse = {
    success?: boolean;

    inside_geofence?: boolean;

    status?: 'present' | 'late' | string;

    attendance_id?: number;

    time_in?: string | null;

    distance?: number;

    radius?: number;

    message?: string;
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
}

function distanceInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const earthRadius = 6371000;

    const toRadians = (degree: number) => (degree * Math.PI) / 180;

    const deltaLatitude = toRadians(lat2 - lat1);

    const deltaLongitude = toRadians(lon2 - lon1);

    const a =
        Math.sin(deltaLatitude / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(deltaLongitude / 2) ** 2;

    const boundedA = Math.max(0, Math.min(1, a));
    const c = 2 * Math.atan2(Math.sqrt(boundedA), Math.sqrt(1 - boundedA));

    return earthRadius * c;
}

/*
|--------------------------------------------------------------------------
| Student Dashboard
|--------------------------------------------------------------------------
*/

export default function StudentDashboard(props: StudentDashboardProps) {
    usePoll(10000, { only: ['currentClass', 'attendanceStats'] });

    return (
        <StudentDashboardContent
            key={`${props.currentClass?.schedule_id ?? 'none'}-${props.currentClass?.check_in ?? ''}`}
            {...props}
        />
    );
}

function StudentDashboardContent({
    student,
    attendanceStats,
    currentClass,
}: StudentDashboardProps) {
    /*
    |--------------------------------------------------------------------------
    | QR
    |--------------------------------------------------------------------------
    */

    const [qrOpen, setQrOpen] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | GPS
    |--------------------------------------------------------------------------
    */

    const { tracking, position, gpsError, toggleTracking } = useLiveLocation();
    const latitude = position?.latitude ?? null;
    const longitude = position?.longitude ?? null;
    const accuracy = position?.accuracy ?? null;
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;

        return () => {
            mounted.current = false;
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Attendance Save State
    |--------------------------------------------------------------------------
    */

    const [attendanceSaved, setAttendanceSaved] = useState(
        Boolean(currentClass?.check_in),
    );

    const [attendanceStatus, setAttendanceStatus] = useState<string | null>(
        currentClass?.check_in
            ? (currentClass.attendance_status ?? 'present')
            : null,
    );

    const [savedCheckIn, setSavedCheckIn] = useState<string | null>(
        currentClass?.check_in ?? null,
    );

    const [attendanceMessage, setAttendanceMessage] = useState<string | null>(
        currentClass?.check_in ? 'Attendance confirmed.' : null,
    );

    const [attendanceError, setAttendanceError] = useState<string | null>(null);

    const [savingAttendance, setSavingAttendance] = useState(false);

    /*
     * Prevent watchPosition from repeatedly
     * submitting the same attendance.
     */
    const attendanceRequestInProgress = useRef(false);

    const attendanceSubmitted = useRef(Boolean(currentClass?.check_in));

    const submittedScheduleId = useRef<number | null>(
        currentClass?.check_in ? (currentClass?.schedule_id ?? null) : null,
    );

    /*
    |--------------------------------------------------------------------------
    | Reset Attendance State When Current Class Changes
    |--------------------------------------------------------------------------
    */

    /*
    |--------------------------------------------------------------------------
    | Student
    |--------------------------------------------------------------------------
    */

    const studentName = student?.name?.trim() || 'Student';

    const courseSection = [student?.course, student?.section]
        .filter(Boolean)
        .join(' ');

    /*
    |--------------------------------------------------------------------------
    | Current Class
    |--------------------------------------------------------------------------
    */

    const subjectTitle = [
        currentClass?.subject_code,

        currentClass?.subject_name,
    ]
        .filter(Boolean)
        .join(' — ');

    const hasCurrentClass = Boolean(
        currentClass?.subject_code || currentClass?.subject_name,
    );

    const classLocation = [currentClass?.building, currentClass?.room]
        .filter(Boolean)
        .join(' – ');

    /*
    |--------------------------------------------------------------------------
    | Geofence
    |--------------------------------------------------------------------------
    */

    const geofenceDistance = useMemo(() => {
        const classLatitude = toNumber(currentClass?.geofence_latitude);
        const classLongitude = toNumber(currentClass?.geofence_longitude);
        const radius = toNumber(currentClass?.geofence_radius_meters);

        if (
            latitude === null ||
            longitude === null ||
            classLatitude === null ||
            classLongitude === null ||
            Math.abs(classLatitude) > 90 ||
            Math.abs(classLongitude) > 180 ||
            radius === null ||
            radius <= 0
        ) {
            return null;
        }

        return distanceInMeters(
            latitude,
            longitude,
            classLatitude,
            classLongitude,
        );
    }, [
        latitude,
        longitude,
        currentClass?.geofence_latitude,
        currentClass?.geofence_longitude,
        currentClass?.geofence_radius_meters,
    ]);

    const computedInsideGeofence =
        geofenceDistance === null
            ? null
            : geofenceDistance <= Number(currentClass?.geofence_radius_meters);

    /*
    |--------------------------------------------------------------------------
    | Save Attendance
    |--------------------------------------------------------------------------
    */

    async function saveAttendance(
        scheduleId: number,
        studentLatitude: number,
        studentLongitude: number,
        studentAccuracy: number,
    ): Promise<CheckInResponse> {
        const csrfToken = document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.getAttribute('content');

        const response = await fetch('/student/attendance/check-in', {
            method: 'POST',

            headers: {
                Accept: 'application/json',

                'Content-Type': 'application/json',

                'X-Requested-With': 'XMLHttpRequest',

                ...(csrfToken
                    ? {
                          'X-CSRF-TOKEN': csrfToken,
                      }
                    : {}),
            },

            credentials: 'same-origin',

            body: JSON.stringify({
                schedule_id: scheduleId,

                latitude: studentLatitude,

                longitude: studentLongitude,
                accuracy: studentAccuracy,
            }),
        });

        let data: CheckInResponse | null = null;

        try {
            data = (await response.json()) as CheckInResponse;
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(
                data?.message ||
                    `Unable to record attendance (${response.status}).`,
            );
        }

        if (!data || data.success !== true) {
            throw new Error(data?.message || 'Attendance was not saved.');
        }

        return data;
    }

    /*
    |--------------------------------------------------------------------------
    | Automatically Check In
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Being inside the geofence is NOT enough to show
    | "Attendance Confirmed".
    |
    | Laravel must successfully save the attendance first.
    |
    */

    useEffect(() => {
        const scheduleId = currentClass?.schedule_id;

        if (
            !tracking ||
            !hasCurrentClass ||
            !scheduleId ||
            currentClass?.recording === false ||
            latitude === null ||
            longitude === null ||
            accuracy === null ||
            accuracy > 50 ||
            computedInsideGeofence !== true
        ) {
            return;
        }

        /*
         * Attendance already exists from server.
         */
        if (currentClass?.check_in) {
            attendanceSubmitted.current = true;

            submittedScheduleId.current = scheduleId;

            return;
        }

        /*
         * We already successfully submitted
         * this exact schedule.
         */
        if (
            attendanceSubmitted.current &&
            submittedScheduleId.current === scheduleId
        ) {
            return;
        }

        /*
         * A request is already running.
         */
        if (attendanceRequestInProgress.current) {
            return;
        }

        const checkIn = async () => {
            attendanceRequestInProgress.current = true;

            setSavingAttendance(true);

            setAttendanceError(null);

            setAttendanceMessage('Confirming attendance...');

            try {
                const result = await saveAttendance(
                    scheduleId,
                    latitude,
                    longitude,
                    accuracy,
                );

                if (!mounted.current) {
                    return;
                }

                /*
                 * Only after Laravel returns success
                 * do we mark attendance as confirmed.
                 */
                attendanceSubmitted.current = true;

                submittedScheduleId.current = scheduleId;

                setAttendanceSaved(true);

                setAttendanceStatus(result.status ?? 'present');

                setSavedCheckIn(result.time_in ?? null);

                setAttendanceMessage(result.message || 'Attendance confirmed.');

                setAttendanceError(null);
            } catch (error) {
                if (!mounted.current) {
                    return;
                }

                attendanceSubmitted.current = false;

                submittedScheduleId.current = null;

                setAttendanceSaved(false);

                setAttendanceStatus(null);

                setAttendanceMessage(null);

                setAttendanceError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to record attendance.',
                );
            } finally {
                attendanceRequestInProgress.current = false;

                if (mounted.current) {
                    setSavingAttendance(false);
                }
            }
        };

        void checkIn();
    }, [
        tracking,
        hasCurrentClass,

        currentClass?.schedule_id,
        currentClass?.recording,

        currentClass?.check_in,

        latitude,
        longitude,

        computedInsideGeofence,
        accuracy,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Attendance
    |--------------------------------------------------------------------------
    */

    const weekPresent = attendanceStats?.week_present;

    const weekTotal = attendanceStats?.week_total;

    const monthPresent = attendanceStats?.month_present;

    const monthTotal = attendanceStats?.month_total;

    const overall = attendanceStats?.overall_percentage;

    const weekPercent =
        weekPresent != null && weekTotal
            ? Math.round((weekPresent / weekTotal) * 100)
            : null;

    const monthPercent =
        monthPresent != null && monthTotal
            ? Math.round((monthPresent / monthTotal) * 100)
            : null;

    /*
    |--------------------------------------------------------------------------
    | Student QR
    |--------------------------------------------------------------------------
    */

    const qrValue = student?.student_id
        ? `PSU-STUDENT:${student.student_id}`
        : 'PSU-STUDENT:UNAVAILABLE';

    /*
    |--------------------------------------------------------------------------
    | Geofence Status Text
    |--------------------------------------------------------------------------
    */

    const geofenceTitle = attendanceSaved
        ? attendanceStatus === 'late'
            ? 'Attendance Recorded — Late'
            : 'Attendance Confirmed'
        : savingAttendance
          ? 'Confirming Attendance'
          : computedInsideGeofence === null
            ? 'Class Area Unavailable'
            : computedInsideGeofence
              ? 'Inside Classroom Area'
              : 'Outside Classroom Area';

    const geofenceMessage = attendanceSaved
        ? attendanceMessage || 'Your attendance has been recorded.'
        : savingAttendance
          ? 'Saving your attendance...'
          : computedInsideGeofence === null
            ? 'A live location and configured class geofence are required.'
            : accuracy !== null && accuracy > 50
              ? 'Waiting for a more accurate GPS signal before confirming attendance.'
              : computedInsideGeofence
                ? attendanceError ||
                  'You are inside the classroom geofence. Waiting for attendance confirmation.'
                : 'Move inside the classroom geofence to confirm attendance';

    const geofenceSuccess = attendanceSaved;

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Head title="Student Dashboard" />

            <div className="min-h-full overflow-x-hidden bg-[#f7f8fa]">
                <main className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-5 sm:py-6 lg:px-7 xl:px-8">
                    {/* TOP SUMMARY CARDS */}

                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            eyebrow="THIS WEEK"
                            value={
                                weekPresent != null && weekTotal != null
                                    ? `${weekPresent}/${weekTotal}`
                                    : '—'
                            }
                            subtext={
                                weekPercent != null
                                    ? `${weekPercent}% present`
                                    : 'Attendance data unavailable'
                            }
                            subtextClass="text-emerald-600"
                            icon={<CheckCircle2 size={27} />}
                            iconClass="bg-emerald-50 text-emerald-500"
                        />

                        <SummaryCard
                            eyebrow="THIS MONTH"
                            value={
                                monthPresent != null && monthTotal != null
                                    ? `${monthPresent}/${monthTotal}`
                                    : '—'
                            }
                            subtext={
                                monthPercent != null
                                    ? `${monthPercent}% present`
                                    : 'Attendance data unavailable'
                            }
                            subtextClass="text-[#9b002d]"
                            icon={<TrendingUp size={27} />}
                            iconClass="bg-[#fff0f4] text-[#9b002d]"
                        />

                        <SummaryCard
                            eyebrow="OVERALL RATE"
                            value={overall != null ? `${overall}%` : '—'}
                            subtext={
                                overall != null
                                    ? overall >= 90
                                        ? 'Excellent standing'
                                        : 'Attendance standing'
                                    : 'Attendance data unavailable'
                            }
                            subtextClass="text-[#9b002d]"
                            icon={<Activity size={27} />}
                            iconClass="bg-[#fff0f4] text-[#9b002d]"
                        />

                        <SummaryCard
                            eyebrow="CLASSES TODAY"
                            value={
                                attendanceStats?.classes_today != null
                                    ? String(attendanceStats.classes_today)
                                    : '—'
                            }
                            subtext={
                                attendanceStats?.classes_remaining != null
                                    ? `${attendanceStats.classes_remaining} remaining`
                                    : 'Schedule data unavailable'
                            }
                            subtextClass="text-amber-600"
                            icon={<GraduationCap size={27} />}
                            iconClass="bg-amber-50 text-amber-500"
                        />
                    </section>

                    {/* MAIN CARD */}

                    <section className="mt-5 rounded-[22px] border border-gray-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-5 lg:p-6">
                        {/* STUDENT INFORMATION + REGISTER BUTTON */}

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                                    Good {getDayPart()}
                                </p>

                                <h2 className="mt-1 text-2xl font-bold text-gray-950">
                                    {studentName}
                                </h2>

                                <p className="mt-1 text-sm break-words text-gray-600">
                                    {[courseSection, student?.student_id]
                                        .filter(Boolean)
                                        .join(' · ') ||
                                        'Student information unavailable'}
                                </p>
                            </div>

                            <Link
                                href="/student/register-class"
                                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#9b002d] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#7e0025] sm:w-auto"
                            >
                                <GraduationCap size={19} />
                                Register for Class
                            </Link>
                        </div>

                        {/* GEOFENCE STATUS */}

                        {hasCurrentClass &&
                            computedInsideGeofence !== undefined && (
                                <div
                                    className={`mt-4 flex min-w-0 flex-col gap-4 rounded-[20px] border px-4 py-4 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5 ${
                                        geofenceSuccess
                                            ? 'border-emerald-200 bg-[#ebfff6]'
                                            : computedInsideGeofence
                                              ? 'border-blue-200 bg-blue-50'
                                              : 'border-amber-200 bg-amber-50'
                                    }`}
                                >
                                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                        <CheckCircle2
                                            size={31}
                                            className={
                                                geofenceSuccess
                                                    ? 'shrink-0 text-emerald-500'
                                                    : computedInsideGeofence
                                                      ? 'shrink-0 text-blue-500'
                                                      : 'shrink-0 text-amber-500'
                                            }
                                        />

                                        <div className="min-w-0">
                                            <h3 className="text-base font-bold text-gray-900 sm:text-lg">
                                                {geofenceTitle}
                                            </h3>

                                            <p className="text-sm break-words text-gray-700">
                                                {geofenceMessage}
                                            </p>

                                            {attendanceError &&
                                                !attendanceSaved && (
                                                    <p className="mt-1 text-xs font-semibold break-words text-red-600">
                                                        {attendanceError}
                                                    </p>
                                                )}
                                        </div>
                                    </div>

                                    {savedCheckIn && (
                                        <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                            <Clock3 size={13} />

                                            {savedCheckIn}
                                        </span>
                                    )}
                                </div>
                            )}

                        {/* CURRENT CLASS */}

                        <div className="mt-4 min-w-0 rounded-[22px] border border-gray-200 bg-white p-4 shadow-sm sm:mt-5 sm:p-5">
                            <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold tracking-[0.16em] text-[#9b002d] uppercase">
                                        {hasCurrentClass
                                            ? 'Now in session'
                                            : 'Current class'}
                                    </p>

                                    <h3 className="mt-2 text-lg font-bold break-words text-gray-950 sm:text-xl">
                                        {hasCurrentClass
                                            ? subjectTitle
                                            : 'No class in session'}
                                    </h3>
                                </div>

                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0f4] text-[#9b002d]">
                                    <Clock3 size={23} />
                                </span>
                            </div>

                            {hasCurrentClass && (
                                <>
                                    <div className="mt-4 min-w-0 space-y-2.5 text-sm text-gray-800">
                                        <InfoRow
                                            icon={<Clock3 size={18} />}
                                            text={
                                                currentClass?.start_time &&
                                                currentClass?.end_time
                                                    ? `${currentClass.start_time} – ${currentClass.end_time}`
                                                    : currentClass?.start_time ||
                                                      currentClass?.end_time ||
                                                      'Schedule unavailable'
                                            }
                                        />

                                        <InfoRow
                                            icon={<MapPin size={18} />}
                                            text={
                                                classLocation ||
                                                'Room information unavailable'
                                            }
                                        />

                                        <InfoRow
                                            icon={<UserRound size={18} />}
                                            text={
                                                currentClass?.instructor ||
                                                'Instructor unavailable'
                                            }
                                        />
                                    </div>

                                    {(savedCheckIn ||
                                        currentClass?.time_in_class ||
                                        currentClass?.end_time) && (
                                        <div className="mt-5 border-t border-gray-100 pt-4">
                                            <div className="flex flex-col gap-2 text-sm font-semibold sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                                <span className="inline-flex items-center gap-2 text-gray-900">
                                                    <Clock3
                                                        size={17}
                                                        className="text-[#9b002d]"
                                                    />
                                                    Time in class
                                                </span>

                                                <span className="text-[#9b002d]">
                                                    {currentClass?.time_in_class ||
                                                        '—'}
                                                </span>
                                            </div>

                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                                                <div className="h-full w-full rounded-full bg-[#9b002d]" />
                                            </div>

                                            <div className="mt-2 flex flex-col gap-1 text-xs text-gray-600 sm:flex-row sm:justify-between">
                                                <span>
                                                    Check-in:{' '}
                                                    {savedCheckIn ||
                                                        currentClass?.check_in ||
                                                        '—'}
                                                </span>

                                                <span>
                                                    Ends:{' '}
                                                    {currentClass?.end_time ||
                                                        '—'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* GPS TRACKING */}

                        <div className="mt-4 min-w-0 rounded-[22px] border border-gray-200 bg-white p-4 shadow-sm sm:mt-5 sm:p-5">
                            <div className="flex min-w-0 items-center justify-between gap-3 sm:gap-4">
                                <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                                        <Radio size={23} />
                                    </span>

                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-950 sm:text-lg">
                                            GPS Tracking
                                        </h3>

                                        <p className="mt-0.5 font-mono text-[11px] leading-5 break-words text-gray-700 sm:text-sm">
                                            {latitude !== null &&
                                            longitude !== null
                                                ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                                                : tracking && !gpsError
                                                  ? 'Getting your location...'
                                                  : 'Location unavailable'}
                                        </p>

                                        <p
                                            className="mt-1 text-xs text-gray-700"
                                            role="status"
                                        >
                                            {gpsError
                                                ? 'GPS unavailable'
                                                : !tracking
                                                  ? 'GPS Off'
                                                  : position
                                                    ? 'GPS Active'
                                                    : 'Getting your location...'}
                                        </p>
                                        {accuracy !== null && (
                                            <p className="mt-1 text-xs text-gray-700">
                                                Accuracy: ±{Math.ceil(accuracy)}{' '}
                                                m
                                            </p>
                                        )}
                                        {accuracy !== null && accuracy > 50 && (
                                            <p
                                                className="mt-1 text-xs break-words text-amber-700"
                                                role="status"
                                            >
                                                GPS signal is weak. Move near a
                                                window or outdoors and try
                                                again.
                                            </p>
                                        )}
                                        {position && (
                                            <>
                                                <p className="mt-1 text-xs text-gray-700">
                                                    {computedInsideGeofence ===
                                                    null
                                                        ? 'Class area unavailable'
                                                        : computedInsideGeofence
                                                          ? 'Inside class area'
                                                          : 'Outside class area'}
                                                    {geofenceDistance !==
                                                        null &&
                                                        ` · ${geofenceDistance.toFixed(1)} m from class center`}
                                                </p>
                                                <a
                                                    href={`https://www.google.com/maps?q=${position.latitude},${position.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-1 inline-block text-xs font-semibold text-emerald-700 underline"
                                                >
                                                    View on Google Maps
                                                </a>
                                            </>
                                        )}

                                        {gpsError && (
                                            <p className="mt-1 text-xs break-words text-red-600">
                                                {gpsError}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={toggleTracking}
                                    aria-pressed={tracking}
                                    aria-label="Toggle GPS tracking"
                                    className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                                        tracking
                                            ? 'bg-emerald-500'
                                            : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                                            tracking
                                                ? 'translate-x-7'
                                                : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* SMALL STATS */}

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-3 sm:gap-4">
                            <MiniStat
                                value={
                                    weekPresent != null && weekTotal != null
                                        ? `${weekPresent}/${weekTotal}`
                                        : '—'
                                }
                                label="This Week"
                                valueClass="text-emerald-600"
                            />

                            <MiniStat
                                value={
                                    monthPresent != null && monthTotal != null
                                        ? `${monthPresent}/${monthTotal}`
                                        : '—'
                                }
                                label="This Month"
                                valueClass="text-[#9b002d]"
                            />

                            <MiniStat
                                value={overall != null ? `${overall}%` : '—'}
                                label="Overall"
                                valueClass="text-[#9b002d]"
                            />
                        </div>

                        {/* STUDENT ID QR */}

                        <div className="mt-4 min-w-0 overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-sm sm:mt-5">
                            <button
                                type="button"
                                onClick={() => setQrOpen((value) => !value)}
                                className="flex w-full min-w-0 items-center justify-between gap-3 p-4 text-left sm:gap-4 sm:p-5"
                                aria-expanded={qrOpen}
                            >
                                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0f4] text-[#9b002d]">
                                        <QrCode size={22} />
                                    </span>

                                    <div className="min-w-0">
                                        <h3 className="font-bold break-words text-gray-950 sm:text-lg">
                                            Student ID QR Code
                                        </h3>

                                        <p className="text-sm break-words text-gray-700">
                                            For manual guard verification
                                        </p>
                                    </div>
                                </div>

                                {qrOpen ? (
                                    <ChevronUp className="shrink-0" size={21} />
                                ) : (
                                    <ChevronDown
                                        className="shrink-0"
                                        size={21}
                                    />
                                )}
                            </button>

                            {qrOpen && (
                                <div className="border-t border-gray-100 px-3 pt-5 pb-6 text-center sm:px-5 sm:pb-7">
                                    <div className="mx-auto inline-flex max-w-full items-center justify-center overflow-hidden rounded-[18px] border-2 border-[#ead0d7] bg-white p-3 sm:p-4">
                                        <QRCodeSVG
                                            value={qrValue}
                                            size={180}
                                            fgColor="#9b002d"
                                            bgColor="#ffffff"
                                            level="M"
                                        />
                                    </div>

                                    <p className="mt-4 font-mono text-sm font-bold break-words text-gray-950">
                                        {student?.student_id ||
                                            'Student ID unavailable'}
                                    </p>

                                    <p className="mt-1 text-sm break-words text-gray-700">
                                        {[studentName, courseSection]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}

/*
|--------------------------------------------------------------------------
| Summary Card
|--------------------------------------------------------------------------
*/

function SummaryCard({
    eyebrow,
    value,
    subtext,
    subtextClass,
    icon,
    iconClass,
}: {
    eyebrow: string;
    value: string;
    subtext: string;
    subtextClass: string;
    icon: ReactNode;
    iconClass: string;
}) {
    return (
        <article className="relative min-h-[138px] min-w-0 rounded-[22px] border border-gray-200 bg-white p-5 pr-16 shadow-sm sm:min-h-[145px] sm:p-6 sm:pr-20">
            <p className="text-sm font-semibold tracking-wide text-gray-500">
                {eyebrow}
            </p>

            <p className="mt-2 text-3xl font-bold break-words text-black sm:text-4xl">
                {value}
            </p>

            <p
                className={`mt-2 text-sm font-semibold break-words ${subtextClass}`}
            >
                {subtext}
            </p>

            <span
                className={`absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full sm:top-6 sm:right-6 sm:h-12 sm:w-12 ${iconClass}`}
            >
                {icon}
            </span>
        </article>
    );
}

/*
|--------------------------------------------------------------------------
| Mini Stat
|--------------------------------------------------------------------------
*/

function MiniStat({
    value,
    label,
    valueClass,
}: {
    value: string;
    label: string;
    valueClass: string;
}) {
    return (
        <div className="min-w-0 rounded-[20px] border border-gray-200 bg-white px-4 py-4 text-center shadow-sm sm:px-5">
            <p className={`text-2xl font-bold break-words ${valueClass}`}>
                {value}
            </p>

            <p className="mt-1 text-sm text-gray-700">{label}</p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Information Row
|--------------------------------------------------------------------------
*/

function InfoRow({ icon, text }: { icon: ReactNode; text: string }) {
    return (
        <div className="flex min-w-0 items-start gap-3">
            <span className="shrink-0 text-gray-900">{icon}</span>

            <span className="min-w-0 break-words">{text}</span>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Greeting
|--------------------------------------------------------------------------
*/

function getDayPart() {
    const hour = new Date().getHours();

    if (hour < 12) {
        return 'Morning';
    }

    if (hour < 18) {
        return 'Afternoon';
    }

    return 'Evening';
}
```

### C:/xampp/htdocs/capstone_system/tests/Feature/Instructor/AutomaticAttendanceTest.php

```php
<?php

namespace Tests\Feature\Instructor;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\User;
use App\Services\AttendanceAutoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Date;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AutomaticAttendanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // These tests verify server props, without calling the live Vite SSR server.
        config(['inertia.ssr.enabled' => false]);
    }

    protected function tearDown(): void
    {
        Date::setTestNow();
        parent::tearDown();
    }

    private function fixture(): array
    {
        Date::setTestNow(Date::parse('2026-10-05 07:00:00', 'Asia/Manila'));
        $owner = User::factory()->create(['role' => 'instructor']);
        $student = User::factory()->create(['role' => 'student', 'section' => 'A']);
        $schedule = Schedule::create([
            'user_id' => $owner->id, 'subject' => 'Automatic attendance', 'instructor' => $owner->name,
            'start_time' => '08:00:00', 'end_time' => '10:00:00', 'students' => 10,
            'location' => 'Room 1', 'coordinates' => '14.5995000, 120.9842000',
            'radius' => '50', 'days' => ['Mon', 'Wednesday', 'Fri'],
            'status' => 'Scheduled', 'recording' => true,
        ]);
        $schedule->registeredStudents()->attach($student, ['registered_at' => now()]);

        return [$owner, $student, $schedule];
    }

    private function time(string $time): void
    {
        Date::setTestNow(Date::parse($time, 'Asia/Manila'));
    }

    private function checkIn(User $student, Schedule $schedule)
    {
        return $this->actingAs($student)->postJson('/student/attendance/check-in', [
            'schedule_id' => $schedule->id, 'latitude' => 14.5995,
            'longitude' => 120.9842, 'accuracy' => 8,
        ]);
    }

    public function test_absence_is_created_only_after_end_and_only_for_registered_students(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        User::factory()->create(['role' => 'student', 'section' => 'A']);
        foreach (['2026-10-05 09:59:59', '2026-10-05 10:00:00'] as $time) {
            $this->time($time);
            $this->assertSame(0, app(AttendanceAutoService::class)->process());
        }
        $this->time('2026-10-05 10:00:01');
        $this->artisan('attendance:process')->assertSuccessful();
        $this->assertDatabaseCount('attendances', 1);
        $this->assertDatabaseHas('attendances', [
            'student_id' => $student->id, 'schedule_id' => $schedule->id,
            'attendance_date' => '2026-10-05 00:00:00', 'status' => 'Absent',
            'time_in' => null, 'time_out' => null, 'latitude' => null, 'longitude' => null,
        ]);
        $this->assertSame(0, app(AttendanceAutoService::class)->process());
    }

    public function test_check_in_boundaries_grace_and_duplicates(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $this->time('2026-10-05 07:44:59');
        $this->checkIn($student, $schedule)->assertUnprocessable();
        $this->time('2026-10-05 07:55:00');
        $this->checkIn($student, $schedule)->assertOk()->assertJsonPath('status', 'present');
        $this->time('2026-10-05 08:27:00');
        $this->checkIn($student, $schedule)->assertOk()->assertJsonPath('status', 'present');
        $this->assertDatabaseCount('attendances', 1);
        Attendance::query()->delete();
        $this->time('2026-10-05 08:15:00');
        $this->checkIn($student, $schedule)->assertOk()->assertJsonPath('status', 'present');
        Attendance::query()->delete();
        $this->time('2026-10-05 08:15:01');
        $this->checkIn($student, $schedule)->assertOk()->assertJsonPath('status', 'late');
        $this->time('2026-10-05 10:01:00');
        $this->checkIn($student, $schedule)->assertUnprocessable();
        $this->assertSame(0, app(AttendanceAutoService::class)->process());
        $this->assertSame('Late', Attendance::firstOrFail()->status);
    }

    public function test_non_class_days_future_dates_and_registration_date_are_skipped(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $this->time('2026-10-06 10:01:00');
        $this->checkIn($student, $schedule)->assertUnprocessable();
        $this->assertSame(0, app(AttendanceAutoService::class)->process(Schedule::query(), '2026-10-06'));
        $this->assertSame(0, app(AttendanceAutoService::class)->process(Schedule::query(), '2026-10-07'));
        $this->time('2026-10-07 10:01:00');
        $schedule->registeredStudents()->updateExistingPivot($student->id, ['registered_at' => now()]);
        $this->assertSame(0, app(AttendanceAutoService::class)->process());
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_overnight_check_in_and_absence_use_session_start_date(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $schedule->update(['start_time' => '23:00:00', 'end_time' => '01:00:00']);
        $this->time('2026-10-06 00:30:00');
        $this->assertSame(0, app(AttendanceAutoService::class)->process());
        $this->checkIn($student, $schedule)->assertOk()->assertJsonPath('status', 'late');
        $this->assertDatabaseHas('attendances', ['attendance_date' => '2026-10-05 00:00:00', 'status' => 'Late']);
        Attendance::query()->delete();
        $this->time('2026-10-06 01:00:01');
        $this->assertSame(1, app(AttendanceAutoService::class)->process());
        $this->assertDatabaseHas('attendances', ['attendance_date' => '2026-10-05 00:00:00', 'status' => 'Absent']);
    }

    public function test_manual_correction_updates_gps_record_and_fallback_never_overwrites_it(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $this->time('2026-10-05 08:04:00');
        $this->checkIn($student, $schedule)->assertOk();
        $id = Attendance::firstOrFail()->id;
        $this->actingAs($owner)->post('/attendance', [
            'student_id' => $student->id, 'schedule_id' => $schedule->id,
            'attendance_date' => '2026-10-05', 'status' => 'late',
        ])->assertRedirect()->assertSessionHasNoErrors();
        $this->time('2026-10-05 10:01:00');
        $this->actingAs($owner)->get('/attendance/create')->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('calendar.'.$schedule->id.'.2026-10-06', 'non_class')
                ->where('calendar.'.$schedule->id.'.2026-10-07', 'pending')
                ->where('attendance.0.status', 'late'));
        $this->assertDatabaseCount('attendances', 1);
        $this->assertDatabaseHas('attendances', ['id' => $id, 'status' => 'Late', 'latitude' => null]);
    }

    public function test_configurable_grace_and_unregistered_check_in(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        config(['attendance.grace_minutes' => 5]);
        $this->time('2026-10-05 08:06:00');
        $this->checkIn($student, $schedule)->assertOk()->assertJsonPath('status', 'late');
        $outsider = User::factory()->create(['role' => 'student']);
        $this->checkIn($outsider, $schedule)->assertForbidden();
    }

    public function test_completed_classes_and_inactive_registrations_are_skipped(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $this->time('2026-10-05 10:01:00');
        $schedule->registeredStudents()->updateExistingPivot($student->id, ['status' => 'inactive']);
        $this->assertSame(0, app(AttendanceAutoService::class)->process());
        $schedule->registeredStudents()->updateExistingPivot($student->id, ['status' => 'active']);
        $schedule->update(['status' => 'Completed']);
        $this->assertSame(0, app(AttendanceAutoService::class)->process());
    }

    public function test_future_and_non_class_manual_writes_are_rejected(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $this->time('2026-10-06 10:01:00');
        foreach (['2026-10-06', '2026-10-07'] as $date) {
            $this->actingAs($owner)->post('/attendance', [
                'student_id' => $student->id, 'schedule_id' => $schedule->id,
                'attendance_date' => $date, 'status' => 'present',
            ])->assertSessionHasErrors('attendance_date');
        }
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_student_dashboard_exposes_early_and_overnight_registered_check_in_sessions(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $this->time('2026-10-05 07:55:00');
        $this->actingAs($student)->get('/student/dashboard')->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('currentClass.schedule_id', $schedule->id)
                ->where('currentClass.recording', true));
        $schedule->update(['start_time' => '23:00:00', 'end_time' => '01:00:00']);
        $this->time('2026-10-06 00:20:00');
        $this->checkIn($student, $schedule)->assertOk()->assertJsonPath('status', 'late');
        $this->actingAs($student)->get('/student/dashboard')->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('currentClass.schedule_id', $schedule->id)
                ->where('currentClass.attendance_status', 'late')
                ->where('currentClass.check_in', '00:20'));
    }

    public function test_dashboard_does_not_offer_unregistered_section_class_for_automatic_check_in(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $schedule->registeredStudents()->detach($student);
        $this->time('2026-10-05 08:05:00');
        $this->actingAs($student)->get('/student/dashboard')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('currentClass', null));
    }
}
```

## Current setup and optional commands

No migration is required. The source and frontend build are saved. The Windows attendance task is enabled; you do not need an additional schedule:work terminal on this computer.

Refresh the student dashboard and instructor attendance page once.

Optional checks, from C:/xampp/htdocs/capstone_system:
php artisan schedule:list
php artisan attendance:process
php artisan test --compact tests/Feature/Instructor/AutomaticAttendanceTest.php
npx tsc --noEmit

Timing can be configured in .env:
ATTENDANCE_GRACE_MINUTES=15
ATTENDANCE_EARLY_MINUTES=15
ATTENDANCE_LOOKBACK_DAYS=7

After changing those settings, run:
php artisan config:clear

The installed Windows task is named CapstoneAutomaticAttendance. It invokes artisan schedule:run every minute while you are signed into Windows. Keep the database available. A different deployed server needs its own Laravel scheduler setup.
