<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\StudentNotification;
use App\Models\User;

class StudentNotificationService
{
    public function feed(User $student): array
    {
        $this->sync($student);
        $query = StudentNotification::where('user_id', $student->id)->active();

        return [
            'unread_count' => (clone $query)->whereNull('read_at')->count(),
            'notifications' => $query->orderByDesc('created_at')->orderByDesc('id')->limit(50)
                ->get()->map(fn (StudentNotification $notice) => [
                    'id' => (string) $notice->id, 'title' => $notice->title,
                    'message' => $notice->message, 'href' => $notice->href,
                    'read_at' => $notice->read_at?->toIso8601String(),
                    'created_at' => $notice->created_at->toIso8601String(),
                ])->all(),
        ];
    }

    public function sync(User $student): void
    {
        $notifications = [];
        $todayName = now()->format('l');
        $nowTime = now()->format('H:i:s');

        $upcomingClasses = Schedule::query()
            ->where(function ($query) use ($student) {
                if ($student->section) {
                    $query->whereRaw('LOWER(TRIM(section)) = ?', [strtolower(trim($student->section))])
                        ->orWhereNull('section');
                } else {
                    $query->whereNull('section');
                }
                $query->orWhereHas('registeredStudents', fn ($registered) => $registered->where('users.id', $student->id));
            })
            ->orderBy('start_time')
            ->get(['id', 'subject', 'start_time', 'days'])
            ->filter(fn (Schedule $schedule) => in_array($todayName, $schedule->days ?? [], true)
                && $schedule->start_time >= $nowTime
            )
            ->values();

        foreach ($upcomingClasses as $schedule) {
            $notifications[] = [
                'id' => 'schedule-'.$schedule->id.'-'.now()->toDateString().'-'.substr(sha1($schedule->subject.$schedule->start_time), 0, 12),
                'title' => 'Upcoming class',
                'message' => $schedule->subject.' at '.substr($schedule->start_time, 0, 5),
                'href' => '/student/schedules',
                'expires_at' => now()->setTimeFromTimeString($schedule->start_time),
            ];
        }

        $recentAttendance = Attendance::query()
            ->with('schedule:id,subject')
            ->where('student_id', $student->id)
            ->orderByDesc('attendance_date')
            ->orderByDesc('time_in')
            ->limit(50)
            ->get(['id', 'schedule_id', 'status', 'updated_at']);

        foreach ($recentAttendance as $record) {
            $notifications[] = [
                'id' => 'attendance-'.$record->id.'-'.strtolower($record->status).'-'.$record->updated_at?->format('YmdHis'),
                'title' => 'Attendance recorded',
                'message' => ($record->schedule?->subject ?? 'Class').' · '.$record->status,
                'href' => '/student/attendance',
            ];
        }

        $scheduleKeys = array_column(array_filter($notifications, fn ($notice) => str_starts_with($notice['id'], 'schedule-')), 'id');
        StudentNotification::where('user_id', $student->id)->active()
            ->where('event_key', 'like', 'schedule-%')->whereNotIn('event_key', $scheduleKeys)
            ->update(['expires_at' => now()]);

        foreach ($notifications as $notice) {
            StudentNotification::firstOrCreate(
                ['user_id' => $student->id, 'event_key' => $notice['id']],
                [
                    'title' => $notice['title'], 'message' => $notice['message'],
                    'href' => $notice['href'], 'expires_at' => $notice['expires_at'] ?? null,
                ],
            );
        }
    }
}
