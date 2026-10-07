<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class GuardStudentStatusService
{
    /**
     * Get all schedules that are scheduled for today.
     */
    public function todaySchedules(?CarbonInterface $now = null): Collection
    {
        $now ??= now('Asia/Manila');

        $todayName = $now->format('D');

        return Schedule::query()
            ->with([
                'attendances' => fn ($query) => $query->whereDate('attendance_date', $now->toDateString()),
                'registeredStudents' => function ($query) {
                    $query->where('users.role', 'student');
                },
            ])
            ->get()
            ->filter(function (Schedule $schedule) use ($todayName): bool {
                return in_array(
                    $todayName,
                    $this->normalizeDays($schedule->days),
                    true
                );
            })
            ->values();
    }

    /**
     * Get students that should appear on Guard Student Tracking.
     */
    public function getTrackingStudents(
        ?CarbonInterface $now = null
    ): Collection {
        $now ??= now('Asia/Manila');

        $schedules = $this->todaySchedules($now);

        $studentIds = $schedules
            ->flatMap(function (Schedule $schedule): array {
                return $schedule
                    ->registeredStudents
                    ->pluck('id')
                    ->all();
            })
            ->unique()
            ->values()
            ->all();

        if (empty($studentIds)) {
            return collect();
        }

        return User::query()
            ->where('role', 'student')
            ->whereIn('id', $studentIds)
            ->orderBy('name')
            ->get()
            ->map(function (User $student) use ($schedules, $now): array {
                $status = $this->resolveStudentStatus(
                    $student,
                    $schedules,
                    $now
                );

                $currentSchedule = $this->getCurrentSchedule(
                    $student,
                    $schedules,
                    $now
                );

                return [
                    'id' => $student->id,
                    'name' => $student->name,
                    'studentNumber' => $student->student_id ?: 'Not assigned',
                    'course' => $student->course ?: 'N/A',
                    'year' => $student->year ?: 'N/A',
                    'section' => $student->section ?: 'N/A',
                    'status' => $status,
                    'currentSubject' => $currentSchedule?->subject,
                    'currentInstructor' => $currentSchedule?->instructor,
                    'location' => $currentSchedule?->location,
                    'startTime' => $this->formatTime(
                        $currentSchedule?->start_time
                    ),
                    'endTime' => $this->formatTime(
                        $currentSchedule?->end_time
                    ),
                ];
            })
            ->values();
    }

    /**
     * Resolve the student's current status.
     */
    public function resolveStudentStatus(
        User $student,
        ?Collection $schedules = null,
        ?CarbonInterface $now = null
    ): string {
        $now ??= now('Asia/Manila');

        $scheduleList = $schedules
            ?? $this->todaySchedules($now);

        $relevantSchedules = $scheduleList
            ->filter(
                fn (Schedule $schedule): bool => $this->studentHasSchedule(
                    $student,
                    $schedule
                )
            )
            ->values();

        /*
        |--------------------------------------------------------------------------
        | No classes today
        |--------------------------------------------------------------------------
        */

        if ($relevantSchedules->isEmpty()) {
            return 'Vacant / Free';
        }

        /*
        |--------------------------------------------------------------------------
        | Find active classes
        |--------------------------------------------------------------------------
        */

        $activeSchedules = $relevantSchedules
            ->filter(
                fn (Schedule $schedule): bool => $this->isScheduleActive(
                    $schedule,
                    $now
                )
            )
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Check attendance for active classes
        |--------------------------------------------------------------------------
        */

        foreach ($activeSchedules as $schedule) {
            $attendance = $this->getTodayAttendance(
                $student,
                $schedule,
                $now
            );

            if ($attendance === null) {
                continue;
            }

            $attendanceStatus = strtolower(
                trim((string) $attendance->status)
            );

            if ($attendanceStatus === 'late') {
                return 'Late';
            }

            if ($attendanceStatus === 'present') {
                return 'In Class';
            }

            if ($attendanceStatus === 'absent') {
                return 'Absent';
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Active class but no attendance record yet
        |--------------------------------------------------------------------------
        |
        | Do not automatically mark the student as absent.
        */

        if ($activeSchedules->isNotEmpty()) {
            return 'Vacant / Free';
        }

        /*
        |--------------------------------------------------------------------------
        | Check whether all classes are already finished
        |--------------------------------------------------------------------------
        */

        $allClassesDone = $relevantSchedules->every(
            fn (Schedule $schedule): bool => $this->isScheduleDone(
                $schedule,
                $now
            )
        );

        if ($allClassesDone) {
            return 'Classes Done';
        }

        /*
        |--------------------------------------------------------------------------
        | Student still has another class later today
        |--------------------------------------------------------------------------
        */

        return 'Vacant / Free';
    }

    /**
     * Get the student's currently active schedule.
     */
    public function getCurrentSchedule(
        User $student,
        Collection $schedules,
        ?CarbonInterface $now = null
    ): ?Schedule {
        $now ??= now('Asia/Manila');

        return $schedules
            ->filter(
                fn (Schedule $schedule): bool => $this->studentHasSchedule(
                    $student,
                    $schedule
                )
            )
            ->first(
                fn (Schedule $schedule): bool => $this->isScheduleActive(
                    $schedule,
                    $now
                )
            );
    }

    /**
     * Get schedule status for Guard Dashboard.
     */
    public function getScheduleStatus(
        Schedule $schedule,
        ?CarbonInterface $now = null
    ): string {
        $now ??= now('Asia/Manila');

        if (! $this->isScheduleOnToday($schedule, $now)) {
            return 'Upcoming';
        }

        if ($this->isScheduleActive($schedule, $now)) {
            return 'Ongoing';
        }

        if ($this->isScheduleDone($schedule, $now)) {
            return 'Done';
        }

        return 'Upcoming';
    }

    /**
     * Check whether the student is registered in the schedule.
     */
    protected function studentHasSchedule(
        User $student,
        Schedule $schedule
    ): bool {
        if (
            $schedule->relationLoaded('registeredStudents') &&
            $schedule->registeredStudents->contains(
                'id',
                $student->id
            )
        ) {
            return true;
        }

        if (! $schedule->relationLoaded('registeredStudents')) {
            return $schedule
                ->registeredStudents()
                ->where('users.id', $student->id)
                ->exists();
        }

        return false;
    }

    /**
     * Determine whether this schedule runs today.
     */
    protected function isScheduleOnToday(
        Schedule $schedule,
        CarbonInterface $now
    ): bool {
        $todayName = $now->format('D');

        return in_array(
            $todayName,
            $this->normalizeDays($schedule->days),
            true
        );
    }

    /**
     * Determine whether the schedule is currently active.
     */
    protected function isScheduleActive(
        Schedule $schedule,
        CarbonInterface $now
    ): bool {
        if (
            ! $schedule->start_time ||
            ! $schedule->end_time
        ) {
            return false;
        }

        if (! $this->isScheduleOnToday($schedule, $now)) {
            return false;
        }

        try {
            $start = Carbon::parse(
                $now->toDateString()
                .' '
                .$schedule->start_time,
                'Asia/Manila'
            );

            $end = Carbon::parse(
                $now->toDateString()
                .' '
                .$schedule->end_time,
                'Asia/Manila'
            );
        } catch (\Throwable) {
            return false;
        }

        /*
         * IMPORTANT:
         * Do not use named parameter "inclusive:" here.
         * Your installed Carbon version does not support that named parameter.
         */
        return $now->between(
            $start,
            $end,
            true
        );
    }

    /**
     * Determine whether the schedule has finished.
     */
    protected function isScheduleDone(
        Schedule $schedule,
        CarbonInterface $now
    ): bool {
        if (
            ! $schedule->start_time ||
            ! $schedule->end_time
        ) {
            return false;
        }

        if (! $this->isScheduleOnToday($schedule, $now)) {
            return false;
        }

        try {
            $end = Carbon::parse(
                $now->toDateString()
                .' '
                .$schedule->end_time,
                'Asia/Manila'
            );
        } catch (\Throwable) {
            return false;
        }

        return $now->gt($end);
    }

    /**
     * Get today's attendance for a student in a schedule.
     */
    protected function getTodayAttendance(
        User $student,
        Schedule $schedule,
        CarbonInterface $now
    ): ?Attendance {
        $today = $now->toDateString();

        if ($schedule->relationLoaded('attendances')) {
            return $schedule->attendances->firstWhere('student_id', $student->id);
        }

        return Attendance::query()
            ->where('schedule_id', $schedule->id)
            ->where('student_id', $student->id)
            ->whereDate('attendance_date', $today)
            ->first();
    }

    /**
     * Normalize schedule day values.
     */
    protected function normalizeDays(
        array|string|null $days
    ): array {
        if (! is_array($days)) {
            if (
                ! is_string($days) ||
                trim($days) === ''
            ) {
                return [];
            }

            $decoded = json_decode($days, true);

            $days = is_array($decoded)
                ? $decoded
                : explode(',', $days);
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
            ->map(function ($day) use ($map) {
                $key = strtolower(
                    trim((string) $day)
                );

                return $map[$key] ?? null;
            })
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    /**
     * Format time for the frontend.
     */
    protected function formatTime(?string $time): string
    {
        if (! $time) {
            return '';
        }

        try {
            return Carbon::parse(
                $time,
                'Asia/Manila'
            )->format('h:i A');
        } catch (\Throwable) {
            return (string) $time;
        }
    }
}
