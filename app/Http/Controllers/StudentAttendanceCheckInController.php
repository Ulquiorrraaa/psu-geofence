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
