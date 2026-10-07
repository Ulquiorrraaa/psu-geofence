<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminReportController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'dateRange' => ['sometimes', 'in:Today,This Week,This Month,This Year'],
            'reportType' => ['sometimes', 'in:Attendance Summary,Class Report,Absent Students,Late Students'],
        ]);
        $dateRange = $filters['dateRange'] ?? 'This Month';
        $reportType = $filters['reportType'] ?? 'Attendance Summary';
        $now = now('Asia/Manila');
        $start = match ($dateRange) {
            'Today' => $now->copy()->startOfDay(),
            'This Week' => $now->copy()->startOfWeek(),
            'This Year' => $now->copy()->startOfYear(),
            default => $now->copy()->startOfMonth(),
        };
        $records = Attendance::query()->with('schedule:id,subject')->where(function ($query) use ($start, $now) {
            $query->where(function ($query) use ($start, $now) {
                $query->whereDate('attendance_date', '>=', $start)->whereDate('attendance_date', '<=', $now);
            })->orWhere(function ($query) use ($start, $now) {
                $query->whereNull('attendance_date')->whereBetween('created_at', [$start, $now]);
            });
        })->get();
        if ($reportType === 'Absent Students' || $reportType === 'Late Students') {
            $status = $reportType === 'Absent Students' ? 'absent' : 'late';
            $records = $records->filter(fn ($record) => strtolower($record->status) === $status);
        }
        $countStatus = fn ($items, $status) => $items->filter(fn ($record) => strtolower($record->status) === $status)->count();
        $total = $records->count();
        $attended = $countStatus($records, 'present') + $countStatus($records, 'late');
        $classRates = $records->groupBy('schedule_id')->map(function ($items) use ($countStatus) {
            $present = $countStatus($items, 'present');
            $late = $countStatus($items, 'late');

            return [
                'className' => $items->first()->schedule?->subject ?? 'Deleted class',
                'rate' => round(($present + $late) / $items->count() * 100, 1),
                'present' => $present,
                'late' => $late,
                'absent' => $countStatus($items, 'absent'),
            ];
        })->values();

        return Inertia::render('admin/Reports', [
            'filters' => ['dateRange' => $dateRange, 'reportType' => $reportType],
            'reportStats' => [
                'totalRecords' => $total,
                'averageAttendance' => $total ? round($attended / $total * 100, 1) : 0,
                'classesTracked' => $classRates->count(),
                'reportsGenerated' => $records->pluck('student_id')->unique()->count(),
            ],
            'monthlyTrends' => $records->groupBy(fn ($record) => ($record->attendance_date ?? $record->created_at)->format('Y-m'))
                ->sortKeys()->map(fn ($items, $month) => [
                    'month' => $month,
                    'present' => $countStatus($items, 'present'),
                    'late' => $countStatus($items, 'late'),
                    'absent' => $countStatus($items, 'absent'),
                ])->values(),
            'statusDistribution' => collect(['present', 'late', 'absent'])->map(fn ($status) => [
                'name' => ucfirst($status), 'value' => $countStatus($records, $status),
            ]),
            'classRates' => $classRates,
        ]);
    }
}
