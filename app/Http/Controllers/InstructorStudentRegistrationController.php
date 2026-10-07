<?php

namespace App\Http\Controllers;

use App\Models\StudentRegistrationLink;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class InstructorStudentRegistrationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Student Registration Page
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): Response
    {
        $instructor = $request->user();

        abort_unless(
            $instructor &&
            $instructor->role === 'instructor',
            403
        );

        /*
        |--------------------------------------------------------------------------
        | Get Instructor Student Registration Link
        |--------------------------------------------------------------------------
        */

        $registrationLink =
            StudentRegistrationLink::query()
                ->where(
                    'instructor_id',
                    $instructor->id
                )
                ->first();

        /*
        |--------------------------------------------------------------------------
        | Prepare Link Data
        |--------------------------------------------------------------------------
        */

        $linkData = null;

        if ($registrationLink) {
            $linkData = [
                'id' => (int) $registrationLink->id,

                'url' => route(
                    'student-registration.show',
                    [
                        'token' => $registrationLink->token,
                    ]
                ),

                'token' => $registrationLink->token,

                'isActive' => (bool) $registrationLink->is_active,

                'isEnabled' => (bool) $registrationLink->is_active,

                'expiresAt' => $registrationLink
                    ->expires_at
                    ?->toISOString(),
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Registered Students
        |--------------------------------------------------------------------------
        |
        | These are STUDENT REGISTRATION records.
        |
        | They have nothing to do with schedule_student.
        |
        */

        $registeredStudents = [];

        if (
            $registrationLink &&
            method_exists(
                $registrationLink,
                'registrations'
            )
        ) {
            $registeredStudents =
                $registrationLink
                    ->registrations()
                    ->with('student')
                    ->latest()
                    ->get()
                    ->map(
                        function ($registration) {
                            return [
                                'id' => $registration->id,

                                'studentId' => $registration->student_id,

                                'name' => $registration->full_name ?? $registration->student?->name,

                                'email' => $registration->email ?? $registration->student?->email,

                                'studentNumber' => $registration->student_number,

                                'yearLevel' => $registration->year_level,

                                'section' => $registration->section,

                                'status' => $registration->status,

                                'registeredAt' => $registration->created_at
                                    ?->toISOString(),
                            ];
                        }
                    )
                    ->values()
                    ->all();
        }

        return Inertia::render(
            'instructor/StudentRegistration',
            [
                'registrationLink' => $linkData,

                'registeredStudents' => $registeredStudents,

                'registeredCount' => count($registeredStudents),
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Create Student Registration Link
    |--------------------------------------------------------------------------
    */

    public function store(
        Request $request
    ): RedirectResponse {
        $instructor = $request->user();

        abort_unless(
            $instructor &&
            $instructor->role === 'instructor',
            403
        );

        /*
        |--------------------------------------------------------------------------
        | Existing Link
        |--------------------------------------------------------------------------
        */

        $existingLink =
            StudentRegistrationLink::query()
                ->where(
                    'instructor_id',
                    $instructor->id
                )
                ->first();

        if ($existingLink) {
            /*
             * If the existing link was disabled,
             * enable it again.
             */
            if (! $existingLink->is_active) {
                $existingLink->update([
                    'is_active' => true,
                ]);
            }

            return back()->with(
                'success',
                'You already have a student registration link.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Create New Student Registration Link
        |--------------------------------------------------------------------------
        */

        StudentRegistrationLink::create([
            'instructor_id' => $instructor->id,

            'token' => $this->generateUniqueToken(),

            'is_active' => true,

            'expires_at' => null,
        ]);

        return back()->with(
            'success',
            'Student registration link created successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Regenerate STUDENT Registration Link
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | This ONLY changes:
    |
    | student_registration_links.token
    |
    | It does NOT change:
    |
    | schedules.registration_token
    | schedule_student
    | users
    | attendances
    | schedules
    |
    */

    public function regenerate(
        Request $request
    ): RedirectResponse {
        $instructor = $request->user();

        abort_unless(
            $instructor &&
            $instructor->role === 'instructor',
            403
        );

        $registrationLink =
            StudentRegistrationLink::query()
                ->where(
                    'instructor_id',
                    $instructor->id
                )
                ->first();

        /*
        |--------------------------------------------------------------------------
        | Create Link If It Doesn't Exist
        |--------------------------------------------------------------------------
        */

        if (! $registrationLink) {
            StudentRegistrationLink::create([
                'instructor_id' => $instructor->id,

                'token' => $this->generateUniqueToken(),

                'is_active' => true,

                'expires_at' => null,
            ]);

            return back()->with(
                'success',
                'Student registration link created successfully.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Change ONLY Student Registration Token
        |--------------------------------------------------------------------------
        */

        $registrationLink->update([
            'token' => $this->generateUniqueToken(),
        ]);

        return back()->with(
            'success',
            'Student registration link regenerated successfully. The old student registration link is no longer valid.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Disable Student Registration
    |--------------------------------------------------------------------------
    */

    public function disable(
        Request $request
    ): RedirectResponse {
        $instructor = $request->user();

        abort_unless(
            $instructor &&
            $instructor->role === 'instructor',
            403
        );

        $registrationLink =
            StudentRegistrationLink::query()
                ->where(
                    'instructor_id',
                    $instructor->id
                )
                ->first();

        if (! $registrationLink) {
            return back()->with(
                'error',
                'No student registration link was found.'
            );
        }

        $registrationLink->update([
            'is_active' => false,
        ]);

        return back()->with(
            'success',
            'Student registration link disabled successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Enable Student Registration
    |--------------------------------------------------------------------------
    */

    public function enable(
        Request $request
    ): RedirectResponse {
        $instructor = $request->user();

        abort_unless(
            $instructor &&
            $instructor->role === 'instructor',
            403
        );

        $registrationLink =
            StudentRegistrationLink::query()
                ->where(
                    'instructor_id',
                    $instructor->id
                )
                ->first();

        if (! $registrationLink) {
            return back()->with(
                'error',
                'No student registration link was found.'
            );
        }

        $registrationLink->update([
            'is_active' => true,
        ]);

        return back()->with(
            'success',
            'Student registration link enabled successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Generate Unique STUDENT Registration Token
    |--------------------------------------------------------------------------
    */

    private function generateUniqueToken(): string
    {
        do {
            $token = Str::random(64);
        } while (
            StudentRegistrationLink::query()
                ->where(
                    'token',
                    $token
                )
                ->exists()
        );

        return $token;
    }
}
