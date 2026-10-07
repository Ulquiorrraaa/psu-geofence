<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\StudentAttendanceCheckInController;
use App\Models\Attendance;
use Illuminate\Http\Request;

class StudentAttendanceController extends Controller
{
    public function history(Request $request)
    {
        return response()->json(['attendance' => Attendance::where('student_id', $request->user()->id)
            ->with('schedule:id,subject,location')->latest()->get()]);
    }

    public function store(Request $request, StudentAttendanceCheckInController $checkIn)
    {
        return $checkIn->store($request);
    }
}
