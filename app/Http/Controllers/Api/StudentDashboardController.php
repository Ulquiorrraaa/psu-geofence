<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\Attendance;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    public function index(Request $request)
    {
        $student = $request->user();

        $currentClass = Schedule::latest()->first();

        $thisWeekPresent = Attendance::where('student_id', $student->id)
            ->where('status', 'present')
            ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->count();

        $thisMonthPresent = Attendance::where('student_id', $student->id)
            ->where('status', 'present')
            ->whereMonth('created_at', now()->month)
            ->count();

        return response()->json([
            'student' => [
                'name' => $student->name,
                'student_number' => $student->student_number ?? 'STU001',
            ],
            'gps_tracking' => [
                'status' => 'Active',
                'latitude' => '14.5995',
                'longitude' => '120.9842',
            ],
            'current_class' => $currentClass,
            'attendance_status' => 'Attendance Confirmed',
            'weekly_present' => $thisWeekPresent,
            'monthly_present' => $thisMonthPresent,
        ]);
    }
}