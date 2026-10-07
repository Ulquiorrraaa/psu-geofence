<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\StudentRegistration;
use App\Models\User;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $now = now('Asia/Manila');
        $week = Attendance::query()->where(function ($query) use ($now) {
            $query->where(function ($query) use ($now) {
                $query->whereDate('attendance_date', '>=', $now->copy()->startOfWeek())
                    ->whereDate('attendance_date', '<=', $now);
            })->orWhere(function ($query) use ($now) {
                $query->whereNull('attendance_date')->whereBetween('created_at', [$now->copy()->startOfWeek(), $now]);
            });
        })->get();
        $weeklyAttendance = collect(range(0, 6))->map(function ($offset) use ($week, $now) {
            $date = $now->copy()->startOfWeek()->addDays($offset);
            $records = $week->filter(fn ($record) => ($record->attendance_date ?? $record->created_at)->toDateString() === $date->toDateString());

            return [
                'day' => $date->format('D'),
                'present' => $records->filter(fn ($record) => in_array(strtolower($record->status), ['present', 'late'], true))->count(),
                'onTime' => $records->filter(fn ($record) => strtolower($record->status) === 'present')->count(),
                'late' => $records->filter(fn ($record) => strtolower($record->status) === 'late')->count(),
                'absent' => $records->filter(fn ($record) => strtolower($record->status) === 'absent')->count(),
            ];
        });
        $today = $week->filter(fn ($record) => ($record->attendance_date ?? $record->created_at)->toDateString() === $now->toDateString());
        $studentTraffic = collect(range(8, 16))->map(fn ($hour) => [
            'time' => $now->copy()->setTime($hour, 0)->format('gA'),
            'students' => $today->filter(fn ($record) => $record->time_in?->hour === $hour)->pluck('student_id')->unique()->count(),
        ]);

        return Inertia::render('admin/Dashboard', [
            'stats' => [
                'totalStudents' => User::where('role', 'student')->count(),
                'totalInstructors' => User::where('role', 'instructor')->count(),
                'presentToday' => $today->filter(fn ($record) => in_array(strtolower($record->status), ['present', 'late'], true))->pluck('student_id')->unique()->count(),
                'totalClasses' => Schedule::count(),
                'activeClasses' => Schedule::whereIn('status', ['Scheduled', 'Ongoing'])->count(),
                'registeredStudents' => StudentRegistration::distinct('student_id')->count('student_id'),
                'lateToday' => $today->where('status', 'Late')->count(),
                'absentToday' => $today->where('status', 'Absent')->count(),
                'presentRecordsToday' => $today->where('status', 'Present')->count(),
                'attendanceRateToday' => $today->count() ? round($today->whereIn('status', ['Present', 'Late'])->count() / $today->count() * 100, 1) : null,
                'totalGuards' => User::where('role', 'guard')->count(),
            ],
            'recentActivities' => Attendance::with(['student:id,name', 'schedule:id,subject'])->latest()->limit(10)->get()->map(fn ($record) => [
                'name' => $record->student?->name ?? 'Deleted student',
                'className' => $record->schedule?->subject ?? 'Deleted class',
                'status' => ucfirst(strtolower($record->status)),
                'time' => ($record->time_in ?? $record->created_at)->format('Y-m-d H:i'),
            ]),
            'weeklyAttendance' => $weeklyAttendance,
            'studentsPerCourse' => User::where('role', 'student')->selectRaw("COALESCE(NULLIF(course, ''), 'Not set') as label, COUNT(*) as count")->groupBy('course')->get(),
            'studentsPerYear' => User::where('role', 'student')->selectRaw("COALESCE(NULLIF(year, ''), 'Not set') as label, COUNT(*) as count")->groupBy('year')->get(),
            'todayOverview' => [
                ['label' => 'Present', 'count' => $today->where('status', 'Present')->count()],
                ['label' => 'Late', 'count' => $today->where('status', 'Late')->count()],
                ['label' => 'Absent', 'count' => $today->where('status', 'Absent')->count()],
            ],
            'studentTraffic' => $studentTraffic,
        ]);
    }
}
