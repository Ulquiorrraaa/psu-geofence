<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class InstructorClassRegistrationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Show Registration Link
    |--------------------------------------------------------------------------
    */

    public function show(
        Request $request,
        Schedule $schedule
    ): JsonResponse {
        $this->authorizeSchedule(
            $request,
            $schedule
        );

        /*
        |--------------------------------------------------------------------------
        | Make sure this class has a token
        |--------------------------------------------------------------------------
        */

        $schedule->ensureRegistrationLink();

        $students = $schedule->registeredStudents()->get()->map(fn ($student) => [
            'id' => $student->id,
            'name' => $student->name,
            'studentNumber' => $student->pivot->student_number ?? $student->student_id ?? '',
            'yearLevel' => $student->pivot->year_level ?? $student->year ?? '',
            'section' => $student->pivot->section ?? $student->section ?? '',
            'email' => $student->email,
            'registeredAt' => $student->pivot->registered_at,
            'registrationStatus' => $student->pivot->status ?? 'registered',
        ]);

        return response()->json([
            'registration' => [
                'hasLink' => ! empty($schedule->registration_token),
                'url' => route('student.class-registration.show', ['token' => $schedule->registration_token]),
                'isActive' => $schedule->registrationIsAvailable(),
                'isEnabled' => (bool) $schedule->registration_enabled,
                'expiresAt' => $schedule->registration_expires_at?->toIso8601String(),
                'registeredCount' => $students->count(),
            ],
            'students' => $students,
            'schedule_id' => $schedule->id,

            'registration_enabled' => (bool) $schedule->registration_enabled,

            'registration_expires_at' => $schedule
                ->registration_expires_at
                ?->toIso8601String(),

            'registration_url' => route(
                'student.class-registration.show',
                [
                    'token' => $schedule->registration_token,
                ]
            ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Create / Enable Registration Link
    |--------------------------------------------------------------------------
    */

    public function store(
        Request $request,
        Schedule $schedule
    ): RedirectResponse {
        $this->authorizeSchedule(
            $request,
            $schedule
        );

        $schedule->ensureRegistrationLink();

        if (! $schedule->registration_enabled) {
            $schedule->forceFill([
                'registration_enabled' => true,
            ])->save();
        }

        return back()->with(
            'success',
            'Class registration link is ready.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Regenerate THIS Class Only
    |--------------------------------------------------------------------------
    */

    public function regenerate(
        Request $request,
        Schedule $schedule
    ): RedirectResponse {
        $this->authorizeSchedule(
            $request,
            $schedule
        );

        $schedule->regenerateRegistrationLink();

        return back()->with(
            'success',
            'Class registration link regenerated successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Disable Registration Link
    |--------------------------------------------------------------------------
    */

    public function disable(
        Request $request,
        Schedule $schedule
    ): RedirectResponse {
        $this->authorizeSchedule(
            $request,
            $schedule
        );

        $schedule->forceFill([
            'registration_enabled' => false,
        ])->save();

        return back()->with(
            'success',
            'Class registration link disabled.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Enable Registration Link
    |--------------------------------------------------------------------------
    */

    public function enable(
        Request $request,
        Schedule $schedule
    ): RedirectResponse {
        $this->authorizeSchedule(
            $request,
            $schedule
        );

        $schedule->ensureRegistrationLink();

        $schedule->forceFill([
            'registration_enabled' => true,
        ])->save();

        return back()->with(
            'success',
            'Class registration link enabled.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Instructor Ownership Check
    |--------------------------------------------------------------------------
    */

    private function authorizeSchedule(
        Request $request,
        Schedule $schedule
    ): void {
        $instructorId =
            (int) $request->user()->id;

        $ownsSchedule =
            (int) $schedule->user_id === $instructorId ||
            (int) $schedule->instructor_id === $instructorId;

        abort_unless(
            $ownsSchedule,
            403,
            'You are not allowed to manage this class registration link.'
        );
    }
}
