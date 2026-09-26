<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;

class AdminReportController extends Controller
{
    public function index()
    {
        $totalStudents = User::where('role', 'student')->count();

        return Inertia::render('admin/Reports', [
            'reportStats' => [
                'totalRecords' => $totalStudents,
                'averageAttendance' => 0,
                'classesTracked' => 0,
                'reportsGenerated' => 0,
            ],

            'monthlyTrends' => [
                ['month' => 'Jan', 'present' => 0, 'late' => 0, 'absent' => 0],
                ['month' => 'Feb', 'present' => 0, 'late' => 0, 'absent' => 0],
                ['month' => 'Mar', 'present' => 0, 'late' => 0, 'absent' => 0],
                ['month' => 'Apr', 'present' => 0, 'late' => 0, 'absent' => 0],
                ['month' => 'May', 'present' => $totalStudents, 'late' => 0, 'absent' => 0],
            ],

            'statusDistribution' => [
                ['name' => 'Present', 'value' => 0],
                ['name' => 'Late', 'value' => 0],
                ['name' => 'Absent', 'value' => 0],
            ],

            'classRates' => [
                ['className' => 'No class data yet', 'rate' => 0],
            ],
        ]);
    }
}