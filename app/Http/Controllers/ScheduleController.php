<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Rules\ClassroomCoordinates;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    /**
     * Display the authenticated instructor's schedules.
     */
    public function index(): Response
    {
        $schedules = Schedule::query()
            ->where('user_id', Auth::id())
            ->orderBy('start_time')
            ->get();

        return Inertia::render('instructor/Schedules', [
            'instructorSchedules' => $schedules,
        ]);
    }

    /**
     * Store a newly created schedule.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateSchedule($request);

        Schedule::create([
            'user_id' => Auth::id(),
            'subject' => $validated['subject'],
            'section' => $validated['section'] ?? null,
            'instructor' => Auth::user()->name,
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'students' => $validated['students'],
            'location' => $validated['location'],
            'coordinates' => $validated['coordinates'],
            'radius' => $validated['radius'],
            'days' => $validated['days'],
            'status' => $validated['status'],
            'recording' => false,
        ]);

        return back()->with(
            'success',
            'Schedule added successfully.'
        );
    }

    /**
     * Update an existing schedule.
     */
    public function update(
        Request $request,
        Schedule $schedule
    ): RedirectResponse {
        $this->authorizeOwner($schedule);

        $validated = $this->validateSchedule($request);

        $schedule->update([
            'subject' => $validated['subject'],
            'section' => $validated['section'] ?? null,
            'instructor' => Auth::user()->name,
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'students' => $validated['students'],
            'location' => $validated['location'],
            'coordinates' => $validated['coordinates'],
            'radius' => $validated['radius'],
            'days' => $validated['days'],
            'status' => $validated['status'],
        ]);

        return back()->with(
            'success',
            'Schedule updated successfully.'
        );
    }

    /**
     * Turn GPS attendance recording on or off.
     */
    public function updateRecording(
        Request $request,
        Schedule $schedule
    ): RedirectResponse {
        $this->authorizeOwner($schedule);

        $validated = $request->validate([
            'recording' => [
                'required',
                'boolean',
            ],
            'latitude' => [
                'nullable',
                'numeric',
                'between:-90,90',
                'required_if:recording,true',
            ],
            'longitude' => [
                'nullable',
                'numeric',
                'between:-180,180',
                'required_if:recording,true',
            ],
        ]);

        $updateData = [
            'recording' => $validated['recording'],
        ];

        if ($validated['recording']) {
            $updateData['coordinates'] = sprintf(
                '%s, %s',
                $validated['latitude'],
                $validated['longitude']
            );
        }

        $schedule->update($updateData);

        return back()->with(
            'success',
            $validated['recording']
                ? 'GPS attendance recording started.'
                : 'GPS attendance recording stopped.'
        );
    }

    /**
     * Delete a schedule.
     */
    public function destroy(
        Schedule $schedule
    ): RedirectResponse {
        $this->authorizeOwner($schedule);

        $schedule->delete();

        return back()->with(
            'success',
            'Schedule deleted successfully.'
        );
    }

    /**
     * Validate schedule data.
     */
    private function validateSchedule(
        Request $request
    ): array {
        return $request->validate([
            'subject' => [
                'required',
                'string',
                'max:255',
            ],

            /*
            | Section is nullable temporarily so your current Schedule.tsx
            | continues working. Once the section input is added, change
            | nullable to required.
            */
            'section' => [
                'nullable',
                'string',
                'max:100',
            ],

            'start_time' => [
                'required',
                'date_format:H:i',
            ],

            'end_time' => [
                'required',
                'date_format:H:i',
                'after:start_time',
            ],

            'students' => [
                'required',
                'integer',
                'min:1',
                'max:1000',
            ],

            'location' => [
                'required',
                'string',
                'max:255',
            ],

            'coordinates' => [
                'required',
                'string',
                'max:255',
                new ClassroomCoordinates,
            ],

            'radius' => [
                'required',
                'numeric',
                'min:5',
                'max:1000',
            ],

            'days' => [
                'required',
                'array',
                'min:1',
            ],

            'days.*' => [
                'required',
                'string',
                Rule::in([
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                ]),
            ],

            'status' => [
                'required',
                Rule::in([
                    'Scheduled',
                    'Ongoing',
                    'Completed',
                ]),
            ],
        ]);
    }

    /**
     * Ensure the schedule belongs to the authenticated instructor.
     */
    private function authorizeOwner(
        Schedule $schedule
    ): void {
        abort_unless(
            (int) $schedule->user_id === (int) Auth::id(),
            403,
            'You are not allowed to modify this schedule.'
        );
    }
}
