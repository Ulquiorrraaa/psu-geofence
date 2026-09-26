<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class AttendanceController extends Controller
{
    /**
     * Display the attendance sheets.
     */
    public function index(): Response
    {
        return Inertia::render('instructor/Attendance');
    }

    /**
     * Display the attendance-sheet creation form.
     */
    public function create(): Response
    {
        return Inertia::render('instructor/CreateAttendance');
    }

    /**
     * Save a new attendance sheet.
     */
    public function store(Request $request): RedirectResponse
    {
        /*
         * The database save logic will go here after the
         * Attendance model and migration are added.
         */

        return redirect()
            ->route('attendance')
            ->with('success', 'Attendance sheet created successfully.');
    }

    /**
     * Display a selected attendance sheet.
     */
    public function show(string $attendance): Response
    {
        return Inertia::render('instructor/AttendanceDetails', [
            'id' => $attendance,
        ]);
    }
}