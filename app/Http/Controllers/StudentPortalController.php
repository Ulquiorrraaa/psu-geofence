<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentPortalController extends Controller
{
    public function schedules(): Response
    {
        return Inertia::render('student/Schedules', [
            'schedules' => Schedule::query()
                ->orderBy('subject')
                ->get([
                    'id',
                    'subject',
                    'section',
                    'instructor',
                    'start_time',
                    'end_time',
                    'location',
                    'days',
                ]),
        ]);
    }

    public function attendance(Request $request): Response
    {
        return Inertia::render('student/Attendance', [
            'attendance' => Attendance::query()
                ->where('student_id', $request->user()->id)
                ->with('schedule:id,subject,section,instructor')
                ->latest('time_in')
                ->get([
                    'id',
                    'schedule_id',
                    'status',
                    'time_in',
                ]),
        ]);
    }

    public function profile(Request $request): Response
    {
        return Inertia::render('student/Profile', [
            'student' => $request->user()->only([
                'name',
                'email',
                'year',
                'section',
                'adviser',
            ]),
        ]);
    }
}
