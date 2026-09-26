<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $totalStudents = User::where('role', 'student')->count();

        $totalInstructors = User::where('role', 'instructor')->count();

        $totalGuards = User::where('role', 'guard')->count();

        return Inertia::render('admin/Dashboard', [
            'stats' => [
                'totalStudents' => $totalStudents,
                'totalInstructors' => $totalInstructors,
                'totalGuards' => $totalGuards,
            ],

            // WEEKLY ATTENDANCE
            'weeklyAttendance' => [
                [
                    'day' => 'Mon',
                    'present' => User::where('role', 'student')->count(),
                    'absent' => 0,
                ],
                [
                    'day' => 'Tue',
                    'present' => User::where('role', 'student')->count(),
                    'absent' => 0,
                ],
                [
                    'day' => 'Wed',
                    'present' => User::where('role', 'student')->count(),
                    'absent' => 0,
                ],
                [
                    'day' => 'Thu',
                    'present' => User::where('role', 'student')->count(),
                    'absent' => 0,
                ],
                [
                    'day' => 'Fri',
                    'present' => User::where('role', 'student')->count(),
                    'absent' => 0,
                ],
            ],

            // STUDENT TRAFFIC
            'studentTraffic' => [
                [
                    'time' => '8AM',
                    'students' => User::where('role', 'student')->count(),
                ],
                [
                    'time' => '9AM',
                    'students' => User::where('role', 'student')->count(),
                ],
                [
                    'time' => '10AM',
                    'students' => User::where('role', 'student')->count(),
                ],
                [
                    'time' => '11AM',
                    'students' => User::where('role', 'student')->count(),
                ],
                [
                    'time' => '12PM',
                    'students' => User::where('role', 'student')->count(),
                ],
                [
                    'time' => '1PM',
                    'students' => User::where('role', 'student')->count(),
                ],
                [
                    'time' => '2PM',
                    'students' => User::where('role', 'student')->count(),
                ],
                [
                    'time' => '3PM',
                    'students' => User::where('role', 'student')->count(),
                ],
                [
                    'time' => '4PM',
                    'students' => User::where('role', 'student')->count(),
                ],
            ],

            // RECENT ACTIVITY
            'recentActivities' => [],

            // ATTENDANCE RECORDS
            'attendanceRecords' => [],

            // SCHEDULES
            'schedules' => [],

            // REPORT STATS
            'reportStats' => [
                'totalRecords' => 0,
                'averageAttendance' => 0,
                'classesTracked' => 0,
                'reportsGenerated' => 0,
            ],

            // MONTHLY TRENDS
            'monthlyTrends' => [],

            // STATUS DISTRIBUTION
            'statusDistribution' => [],

            // CLASS RATES
            'classRates' => [],
        ]);
    }
}