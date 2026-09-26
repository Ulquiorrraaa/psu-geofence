<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;

class StudentScheduleController extends Controller
{
    public function index()
    {
        $schedules = Schedule::latest()->get();

        return response()->json([
            'schedules' => $schedules,
        ]);
    }
}