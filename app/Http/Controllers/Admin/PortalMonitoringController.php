<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\StudentRegistration;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PortalMonitoringController extends Controller
{
    public function registrations(Request $request)
    {
        $filters = $request->validate([
            'kind' => ['nullable', 'in:information,classes'],
            'student' => ['nullable', 'string', 'max:255'],
        ]);
        $kind = $filters['kind'] ?? 'information';
        if ($kind === 'classes') {
            $query = DB::table('schedule_student as registration')
                ->join('users as student', 'student.id', '=', 'registration.student_id')
                ->join('schedules as class', 'class.id', '=', 'registration.schedule_id')
                ->leftJoin('users as instructor', 'instructor.id', '=', 'class.user_id')
                ->select(['registration.id', 'student.name', 'student.email', 'registration.student_number',
                    'registration.year_level', 'registration.section', 'registration.status', 'registration.registered_at',
                    'class.subject', 'instructor.name as instructor']);
            if (! empty($filters['student'])) {
                $query->where(fn ($q) => $q->where('student.name', 'like', '%'.$filters['student'].'%')->orWhere('registration.student_number', 'like', '%'.$filters['student'].'%'));
            }
            $records = $query->orderByDesc('registration.id')->paginate(25)->withQueryString();
        } else {
            $query = StudentRegistration::with(['student:id,name,email', 'instructor:id,name']);
            if (! empty($filters['student'])) {
                $query->where(fn ($q) => $q->where('student_number', 'like', '%'.$filters['student'].'%')->orWhereHas('student', fn ($q) => $q->where('name', 'like', '%'.$filters['student'].'%')));
            }
            $records = $query->latest()->paginate(25)->withQueryString()->through(fn ($row) => [
                'id' => $row->id, 'name' => $row->full_name ?: $row->student?->name,
                'email' => $row->email ?: $row->student?->email,
                'student_number' => $row->student_number, 'year_level' => $row->year_level,
                'section' => $row->section, 'status' => $row->status, 'registered_at' => $row->registered_at,
                'subject' => null, 'instructor' => $row->instructor?->name,
            ]);
        }

        return Inertia::render('admin/Registrations', [
            'records' => $records, 'filters' => ['kind' => $kind, 'student' => $filters['student'] ?? ''],
        ]);
    }

    public function classes(Request $request)
    {
        $filters = $request->validate([
            'instructor' => ['nullable', 'integer'], 'section' => ['nullable', 'string', 'max:100'],
            'day' => ['nullable', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'],
            'status' => ['nullable', 'in:Scheduled,Ongoing,Completed'],
        ]);
        $query = Schedule::with('user:id,name')->withCount(['registeredStudents' => fn ($q) => $q->where('schedule_student.status', 'active')]);
        foreach (['section', 'status'] as $field) {
            if (! empty($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }
        if (! empty($filters['instructor'])) {
            $query->where('user_id', $filters['instructor']);
        }
        if (! empty($filters['day'])) {
            $query->whereJsonContains('days', $filters['day']);
        }

        return Inertia::render('admin/Classes', [
            'records' => $query->latest()->paginate(25)->withQueryString(),
            'filters' => $filters,
            'instructors' => User::where('role', 'instructor')->get(['id', 'name']),
        ]);
    }

    public function attendance(Request $request)
    {
        $filters = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'], 'student' => ['nullable', 'string', 'max:255'],
            'instructor' => ['nullable', 'integer'], 'subject' => ['nullable', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:100'], 'status' => ['nullable', 'in:Present,Late,Absent'],
        ]);
        $query = Attendance::with(['student:id,name,student_id', 'schedule.user:id,name', 'schedule']);
        if (! empty($filters['date'])) {
            $query->where(fn ($q) => $q->whereDate('attendance_date', $filters['date'])
                ->orWhere(fn ($q) => $q->whereNull('attendance_date')->whereDate('created_at', $filters['date'])));
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['student'])) {
            $query->whereHas('student', fn ($q) => $q->where(fn ($q) => $q->where('name', 'like', '%'.$filters['student'].'%')->orWhere('student_id', 'like', '%'.$filters['student'].'%')));
        }
        foreach (['instructor' => 'user_id', 'subject' => 'subject', 'section' => 'section'] as $filter => $column) {
            if (! empty($filters[$filter])) {
                $query->whereHas('schedule', fn ($q) => $q->where($column, $filters[$filter]));
            }
        }

        return Inertia::render('admin/AttendanceMonitoring', [
            'records' => $query->latest()->paginate(25)->withQueryString(),
            'filters' => $filters,
            'instructors' => User::where('role', 'instructor')->get(['id', 'name']),
        ]);
    }

    public function activity(Request $request)
    {
        $filters = $request->validate(['search' => ['nullable', 'string', 'max:255']]);

        return Inertia::render('admin/ActivityLogs', [
            'records' => ActivityLog::query()->when($filters['search'] ?? null, fn ($q, $search) => $q->where(fn ($q) => $q->where('action', 'like', '%'.$search.'%')->orWhere('actor_name', 'like', '%'.$search.'%')))
                ->latest()->paginate(25)->withQueryString(),
            'filters' => $filters,
        ]);
    }

    public function user(User $user)
    {
        $user->load(['registeredSchedules', 'schedules', 'studentRegistrations']);
        $records = $user->attendances()->with('schedule:id,subject')->latest()->paginate(20)->withQueryString();
        $total = $user->attendances()->whereIn('status', ['Present', 'Late', 'Absent'])->count();
        $attended = $user->attendances()->whereIn('status', ['Present', 'Late'])->count();

        return Inertia::render('admin/UserDetails', [
            'profile' => $user,
            'records' => $records,
            'percentage' => $total ? round($attended / $total * 100, 1) : null,
        ]);
    }

    public function status(Request $request, User $user)
    {
        $data = $request->validate(['status' => ['required', 'in:Active,Inactive']]);
        abort_if($request->user()->id === $user->id && $data['status'] === 'Inactive', 422, 'You cannot deactivate your own account.');
        $user->getConnection()->transaction(function () use ($user, $data) {
            $user->update($data);
            if ($data['status'] === 'Inactive') {
                $user->tokens()->delete();
            }
        });

        return back()->with('success', 'Account status updated successfully.');
    }
}
