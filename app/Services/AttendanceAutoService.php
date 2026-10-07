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
