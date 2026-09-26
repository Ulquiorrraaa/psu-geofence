<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    public function index()
    {
        $schedules = Schedule::where('instructor_id', auth()->id())
            ->latest()
            ->get();

        return Inertia::render('instructor/Schedules', [
            'instructorSchedules' => $schedules,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateSchedule($request);

        /*
         * Your schedules table requires user_id.
         * Both IDs identify the currently logged-in instructor.
         */
        $validated['user_id'] = auth()->id();
        $validated['instructor_id'] = auth()->id();
        $validated['instructor'] = auth()->user()->name;
        $validated['recording'] = false;

        Schedule::create($validated);

        return back()->with(
            'success',
            'Schedule added successfully.'
        );
    }

    public function update(
        Request $request,
        Schedule $schedule
    ) {
        $this->ensureScheduleOwner($schedule);

        $validated = $this->validateSchedule($request);

        $validated['user_id'] = auth()->id();
        $validated['instructor_id'] = auth()->id();
        $validated['instructor'] = auth()->user()->name;

        $schedule->update($validated);

        return back()->with(
            'success',
            'Schedule updated successfully.'
        );
    }

    public function updateRecording(
        Request $request,
        Schedule $schedule
    ) {
        $this->ensureScheduleOwner($schedule);

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

        $data = [
            'recording' => $validated['recording'],
        ];

        if (
            $validated['recording'] &&
            isset(
                $validated['latitude'],
                $validated['longitude']
            )
        ) {
            $data['coordinates'] =
                $validated['latitude']
                .', '
                .$validated['longitude'];
        }

        $schedule->update($data);

        return back()->with(
            'success',
            $validated['recording']
                ? 'GPS attendance recording started.'
                : 'GPS attendance recording stopped.'
        );
    }

    public function destroy(Schedule $schedule)
    {
        $this->ensureScheduleOwner($schedule);

        $schedule->delete();

        return back()->with(
            'success',
            'Schedule deleted successfully.'
        );
    }

    private function validateSchedule(
        Request $request
    ): array {
        return $request->validate([
            'subject' => [
                'required',
                'string',
                'max:255',
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

    private function ensureScheduleOwner(
        Schedule $schedule
    ): void {
        abort_unless(
            (int) $schedule->instructor_id ===
                (int) auth()->id(),
            403,
            'You are not allowed to modify this schedule.'
        );
    }
}