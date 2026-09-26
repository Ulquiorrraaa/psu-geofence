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
                    'present' => $totalStudents,
                    'absent' => 0,
                ],
                [
                    'day' => 'Tue',
                    'present' => $totalStudents,
                    'absent' => 0,
                ],
                [
                    'day' => 'Wed',
                    'present' => $totalStudents,
                    'absent' => 0,
                ],
                [
                    'day' => 'Thu',
                    'present' => $totalStudents,
                    'absent' => 0,
                ],
                [
                    'day' => 'Fri',
                    'present' => $totalStudents,
                    'absent' => 0,
                ],
            ],

            // STUDENT TRAFFIC
            'studentTraffic' => [
                [
                    'time' => '8AM',
                    'students' => $totalStudents,
                ],
                [
                    'time' => '9AM',
                    'students' => $totalStudents,
                ],
                [
                    'time' => '10AM',
                    'students' => $totalStudents,
                ],
                [
                    'time' => '11AM',
                    'students' => $totalStudents,
                ],
                [
                    'time' => '12PM',
                    'students' => $totalStudents,
                ],
                [
                    'time' => '1PM',
                    'students' => $totalStudents,
                ],
                [
                    'time' => '2PM',
                    'students' => $totalStudents,
                ],
                [
                    'time' => '3PM',
                    'students' => $totalStudents,
                ],
                [
                    'time' => '4PM',
                    'students' => $totalStudents,
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
