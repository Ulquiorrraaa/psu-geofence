<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class StudentScheduleController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(['schedules' => $request->user()->registeredSchedules()
            ->latest('schedules.created_at')->get(['schedules.id', 'subject', 'schedules.section', 'instructor', 'start_time', 'end_time', 'location', 'days', 'schedules.status', 'recording'])]);
    }
}
