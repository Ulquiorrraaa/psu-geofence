<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\User;
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'instructor_id' => 'required|exists:users,id',
            'subject' => 'required|string|max:255',
            'start_time' => 'required',
            'end_time' => 'required',
            'students' => 'nullable|integer',
            'location' => 'nullable|string|max:255',
            'coordinates' => 'nullable|string|max:255',
            'radius' => 'nullable|string|max:255',
            'days' => 'required|array',
            'status' => 'nullable|string',
        ]);

        $instructor = User::findOrFail($validated['instructor_id']);

        $validated['instructor'] = $instructor->name;
        $validated['status'] = $validated['status'] ?? 'Scheduled';

        Schedule::create($validated);

        return back()->with('success', 'Schedule added successfully.');
    }
}