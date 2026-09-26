<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\Request;

class StudentAttendanceController extends Controller
{
    public function history(Request $request)
    {
        $records = Attendance::where('student_id', $request->user()->id)
            ->with('schedule')
            ->latest()
            ->get();

        return response()->json([
            'attendance' => $records,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'schedule_id' => 'required|exists:schedules,id',
            'latitude' => 'required',
            'longitude' => 'required',
        ]);

        $attendance = Attendance::create([
            'student_id' => $request->user()->id,
            'schedule_id' => $request->schedule_id,
            'status' => 'present',
            'time_in' => now()->format('H:i:s'),
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
        ]);

        return response()->json([
            'message' => 'Attendance recorded successfully',
            'attendance' => $attendance,
        ]);
    }
}