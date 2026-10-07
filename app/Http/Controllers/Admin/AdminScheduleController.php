<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\User;
use App\Rules\ClassroomCoordinates;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminScheduleController extends Controller
{
    public function index()
    {
        $instructors = User::where('role', 'instructor')
            ->with('schedules')
            ->get();

        return Inertia::render('admin/Schedules', [
            'instructors' => $instructors,
        ]);
    }

    private function validatedSchedule(Request $request): array
    {
        $validated = $request->validate([
            'instructor_id' => 'required|integer|exists:users,id,role,instructor',
            'section' => 'nullable|string|max:100',
            'subject' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'students' => 'required|integer|min:1|max:1000',
            'location' => 'required|string|max:255',
            'coordinates' => ['required', 'string', 'max:255', new ClassroomCoordinates],
            'radius' => 'required|numeric|min:5|max:1000',
            'days' => 'required|array|min:1',
            'days.*' => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'status' => 'nullable|in:Scheduled,Ongoing,Completed',
        ]);

        $instructor = User::findOrFail($validated['instructor_id']);

        $validated['user_id'] = $instructor->id;
        $validated['instructor'] = $instructor->name;
        $validated['status'] = $validated['status'] ?? 'Scheduled';

        return $validated;
    }

    public function store(Request $request)
    {
        abort(403, 'Only instructors can create their own schedules.');
    }

    public function update(Request $request, Schedule $schedule)
    {
        $schedule->update($this->validatedSchedule($request));

        return back()->with('success', 'Schedule updated successfully.');
    }

    public function destroy(Schedule $schedule)
    {
        $schedule->delete();

        return back()->with('success', 'Schedule deleted successfully.');
    }
}
