<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    public function index(Request $request)
    {
        $student = $request->user();
        $now = now('Asia/Manila');
        $currentClass = $student->registeredSchedules()->get()->first(fn ($schedule) => in_array($now->format('l'), $schedule->days ?? [], true)
            && $schedule->start_time <= $now->format('H:i:s')
            && $schedule->end_time >= $now->format('H:i:s')
        );
        $todayAttendance = $currentClass ? $student->attendances()->where('schedule_id', $currentClass->id)
            ->whereDate('attendance_date', $now->toDateString())->first() : null;
        $present = $student->attendances()->whereRaw('LOWER(status) IN (?, ?)', ['present', 'late']);

        return response()->json([
            'student' => ['name' => $student->name, 'student_number' => $student->student_id],
            'gps_tracking' => [
                // Current location is obtained exclusively by the browser.
                'status' => 'Awaiting browser location',
                'latitude' => null,
                'longitude' => null,
            ],
            'current_class' => $currentClass?->only(['id', 'subject', 'location', 'start_time', 'end_time', 'recording']),
            'attendance_status' => $todayAttendance?->status,
            'weekly_present' => (clone $present)->whereDate('attendance_date', '>=', $now->copy()->startOfWeek())
                ->whereDate('attendance_date', '<=', $now)->count(),
            'monthly_present' => (clone $present)->whereDate('attendance_date', '>=', $now->copy()->startOfMonth())
                ->whereDate('attendance_date', '<=', $now)->count(),
        ]);
    }
}
