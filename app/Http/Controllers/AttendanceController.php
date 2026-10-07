<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Services\AttendanceAutoService;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function adminIndex(): Response
    {
        return Inertia::render('admin/Attendance', [
            'instructorAttendanceRecords' => Attendance::with(['student', 'schedule'])->latest()->get()->map(fn ($record) => [
                'studentId' => $record->student?->student_id ?? (string) $record->student_id,
                'name' => $record->student?->name ?? 'Deleted student',
                'className' => $record->schedule?->subject ?? 'Deleted class',
                'time' => $record->time_in?->format('Y-m-d H:i') ?? '',
                'status' => ucfirst(strtolower($record->status)),
                'location' => $record->schedule?->location ?? '',
                'coordinates' => $record->latitude !== null ? $record->latitude.', '.$record->longitude : '',
            ]),
        ]);
    }

    public function index(Request $request): Response
    {
        app(AttendanceAutoService::class)->process(Schedule::where('user_id', $request->user()->id));

        return Inertia::render('instructor/Attendance', [
            'instructorAttendanceRecords' => Attendance::query()
                ->whereHas('schedule', fn ($query) => $query->where('user_id', $request->user()->id))
                ->with(['student', 'schedule'])->latest()->get()->map(fn (Attendance $record) => [
                    'id' => $record->id,
                    'studentKey' => $record->student_id,
                    'scheduleId' => $record->schedule_id,
                    'date' => $record->attendance_date?->toDateString() ?? $record->created_at?->toDateString(),
                    'timeOut' => $record->time_out?->format('H:i') ?? '',
                    'gpsLocked' => $record->latitude !== null || $record->longitude !== null,
                    'studentId' => $record->student?->student_id ?? (string) $record->student_id,
                    'name' => $record->student?->name ?? 'Deleted student',
                    'className' => $record->schedule?->subject ?? 'Deleted class',
                    'time' => $record->time_in?->format('H:i') ?? '',
                    'status' => ucfirst(strtolower($record->status)),
                    'location' => $record->schedule?->location ?? '',
                    'coordinates' => $record->latitude !== null ? $record->latitude.', '.$record->longitude : '',
                ]),
        ]);
    }

    public function create(Request $request): Response
    {
        $validated = $request->validate([
            'sheet_start' => ['sometimes', 'date_format:Y-m-d'],
            'sheet_weeks' => ['sometimes', 'integer', 'min:1', 'max:12'],
        ]);
        $now = now(config('app.timezone'));
        $start = CarbonImmutable::parse($validated['sheet_start'] ?? $now->toDateString(), config('app.timezone'))->startOfWeek();
        $weeks = (int) ($validated['sheet_weeks'] ?? 4);
        $service = app(AttendanceAutoService::class);
        $service->process(Schedule::where('user_id', $request->user()->id), $start->toDateString(), $start->addWeeks($weeks)->subDay()->toDateString());
        $schedules = Schedule::where('user_id', $request->user()->id)
            ->with(['registeredStudents', 'attendances'])->get();
        $calendar = [];
        foreach ($schedules as $schedule) {
            for ($offset = 0; $offset < $weeks * 7; $offset++) {
                $date = $start->addDays($offset)->toDateString();
                $session = $service->session($schedule, $date);
                $calendar[$schedule->id][$date] = ! $session ? 'non_class'
                    : ($now->gt($session[1]) ? 'finished' : ($now->lt($session[0]) ? 'pending' : 'ongoing'));
            }
        }

        return Inertia::render('instructor/CreateAttendance', [
            'calendar' => $calendar,
            'today' => $now->toDateString(),
            'subjects' => $schedules->map(fn ($schedule) => ['id' => $schedule->id, 'name' => $schedule->subject]),
            'students' => $schedules->flatMap(fn ($schedule) => $schedule->registeredStudents->map(fn ($student) => [
                'id' => $student->id,
                'student_id' => $student->student_id ?? (string) $student->id,
                'name' => $student->name,
                'year' => $student->pivot->year_level ?? $student->year ?? '',
                'section' => $student->pivot->section ?? $student->section ?? '',
                'subject_id' => $schedule->id,
            ])),
            'attendance' => $schedules->flatMap(fn ($schedule) => $schedule->attendances->map(fn ($record) => [
                'student_id' => $record->student_id,
                'schedule_id' => $record->schedule_id,
                'date' => ($record->attendance_date ?? $record->created_at)->toDateString(),
                'gps_locked' => $record->latitude !== null || $record->longitude !== null,
                'status' => strtolower($record->status) === 'present'
                    ? ($record->latitude !== null ? 'present_gps' : 'present_manual')
                    : strtolower($record->status),
            ])),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'integer', 'exists:users,id'],
            'schedule_id' => ['required', 'integer', 'exists:schedules,id'],
            'attendance_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'status' => ['nullable', 'in:present,late,absent'],
        ]);
        $schedule = Schedule::findOrFail($validated['schedule_id']);
        abort_unless($schedule->user_id === $request->user()->id, 403);
        abort_unless($schedule->registeredStudents()->where('users.id', $validated['student_id'])->where('role', 'student')->exists(), 403);

        if (! app(AttendanceAutoService::class)->session($schedule, $validated['attendance_date'])) {
            throw ValidationException::withMessages(['attendance_date' => 'This is not a scheduled class day.']);
        }

        $schedule->getConnection()->transaction(function () use ($schedule, $validated): void {
            // Serialize writes for this class, including concurrent check-ins.
            Schedule::whereKey($schedule->id)->lockForUpdate()->first();
            $key = [
                'student_id' => $validated['student_id'],
                'schedule_id' => $schedule->id,
                'attendance_date' => $validated['attendance_date'],
            ];
            $existing = Attendance::where('student_id', $validated['student_id'])->where('schedule_id', $schedule->id)->whereDate('attendance_date', $validated['attendance_date'])->first();
            if ($existing && ($existing->latitude !== null || $existing->longitude !== null)) {
                throw ValidationException::withMessages(['status' => 'GPS attendance cannot be changed or cleared manually.']);
            }

            if ($validated['status'] === null) {
                $existing?->delete();
            } else {
                $record = $existing ?? new Attendance($key);
                $record->fill([
                    'status' => $validated['status'],
                    'latitude' => null,
                    'longitude' => null,
                    'time_out' => $validated['status'] === 'absent' ? null : $existing?->time_out,
                    'time_in' => $validated['status'] === 'absent' ? null : ($existing?->time_in ?? $validated['attendance_date'].' '.now()->format('H:i:s')),
                ])->save();
            }
        });

        return back()->with('success', 'Attendance saved successfully.');
    }

    public function destroy(Request $request, Attendance $attendance): RedirectResponse
    {
        abort_unless($attendance->schedule?->user_id === $request->user()->id, 403);
        $attendance->getConnection()->transaction(function () use ($attendance): void {
            Schedule::whereKey($attendance->schedule_id)->lockForUpdate()->firstOrFail();
            $record = Attendance::whereKey($attendance->id)->lockForUpdate()->firstOrFail();
            if ($record->latitude !== null || $record->longitude !== null) {
                throw ValidationException::withMessages(['status' => 'GPS attendance cannot be deleted manually.']);
            }
            $record->delete();
        });

        return back()->with('success', 'Attendance record deleted successfully.');
    }
}
