<?php

namespace App\Http\Controllers;

use App\Models\StudentRegistration;
use App\Models\StudentRegistrationLink;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StudentRegistrationController extends Controller
{
    public function index(Request $request): Response
    {
        $student = $request->user();
        abort_unless($student && $student->role === 'student', 403);

        return Inertia::render('student/StudentRegistration', [
            'token' => null,
            'student' => [
                'name' => $student->name, 'studentNumber' => $student->student_id,
                'email' => $student->email,
                'course' => $student->course,
                'yearLevel' => $student->year, 'section' => $student->section,
            ],
            'alreadyRegistered' => false, 'registration' => null,
        ]);
    }

    public function validateToken(Request $request): RedirectResponse
    {
        $validated = $request->validate(['token' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9_-]+$/']]);
        $link = StudentRegistrationLink::where('token', $validated['token'])->first();
        if (! $link) {
            return back()->withErrors(['token' => 'Registration link not found. Please check the link or token.']);
        }
        if (! $link->is_active) {
            return back()->withErrors(['token' => 'This registration link is disabled.']);
        }
        if (! $link->isAvailable()) {
            return back()->withErrors(['token' => 'This registration link has expired.']);
        }

        return redirect()->route('student-registration.show', ['token' => $link->token]);
    }

    public function storeFromPortal(Request $request): RedirectResponse
    {
        $validated = $request->validate(['token' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9_-]+$/']]);

        return $this->store($request, $validated['token']);
    }

    /*
    |--------------------------------------------------------------------------
    | Show Student Registration Form
    |--------------------------------------------------------------------------
    |
    | This controller is ONLY for STUDENT INFORMATION REGISTRATION.
    |
    | It is NOT used for:
    |
    | - Register for Class
    | - schedule_student
    | - Schedule registration_token
    |
    */

    public function show(
        Request $request,
        string $token
    ): Response {
        $student = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Student Only
        |--------------------------------------------------------------------------
        */

        abort_unless(
            $student &&
            $student->role === 'student',
            403,
            'Only students can use this registration link.'
        );

        /*
        |--------------------------------------------------------------------------
        | Find STUDENT Registration Link
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | This uses StudentRegistrationLink.
        |
        | It does NOT search Schedule.
        |
        */

        $link = StudentRegistrationLink::query()
            ->with(
                'instructor:id,name,email'
            )
            ->where(
                'token',
                $token
            )
            ->first();

        /*
        |--------------------------------------------------------------------------
        | Invalid / Disabled / Expired Link
        |--------------------------------------------------------------------------
        */

        if (
            ! $link ||
            ! $link->isAvailable()
        ) {
            return Inertia::render(
                'student/StudentRegistrationUnavailable',
                [
                    'message' => 'This student registration link is invalid, disabled, or expired.',
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Check Existing Student Registration
        |--------------------------------------------------------------------------
        |
        | Registration is checked using:
        |
        | instructor_id + student_id
        |
        | This has nothing to do with class registration.
        |
        */

        $existingRegistration =
            StudentRegistration::query()
                ->where(
                    'instructor_id',
                    $link->instructor_id
                )
                ->where(
                    'student_id',
                    $student->id
                )
                ->first();

        /*
        |--------------------------------------------------------------------------
        | Render Student Registration Page
        |--------------------------------------------------------------------------
        */

        return Inertia::render(
            'student/StudentRegistration',
            [
                'token' => $token,

                'instructor' => [
                    'id' => $link->instructor?->id,

                    'name' => $link->instructor?->name
                        ?? 'Instructor',

                    'email' => $link->instructor?->email,
                ],

                /*
                |--------------------------------------------------------------------------
                | Existing Student Account Information
                |--------------------------------------------------------------------------
                |
                | These are used as the default form values.
                |
                */

                'student' => [
                    'name' => $student->name,

                    'studentNumber' => $student->student_id,

                    'yearLevel' => $student->year,

                    'section' => $student->section,

                    'email' => $student->email,
                    'course' => $student->course,
                ],

                'alreadyRegistered' => (bool) $existingRegistration,

                'registration' => $existingRegistration
                        ? [
                            'fullName' => $existingRegistration->full_name ?? $student->name,
                            'email' => $existingRegistration->email ?? $student->email,
                            'course' => $existingRegistration->course ?? $student->course,

                            'studentNumber' => $existingRegistration->student_number,

                            'yearLevel' => $existingRegistration->year_level,

                            'section' => $existingRegistration->section,

                            'status' => $existingRegistration->status,

                            'registeredAt' => $existingRegistration
                                ->registered_at
                                ?->toISOString(),
                        ]
                        : null,

                'success' => session('success'),
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Register Student Information
    |--------------------------------------------------------------------------
    |
    | THIS is the controller that is allowed to update:
    |
    | users.name
    | users.student_id
    | users.year
    | users.section
    |
    | Register for Class must NOT update those fields.
    |
    */

    public function store(
        Request $request,
        string $token
    ): RedirectResponse {
        $student = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Student Only
        |--------------------------------------------------------------------------
        */

        abort_unless(
            $student &&
            $student->role === 'student',
            403,
            'Only students can register.'
        );

        /*
        |--------------------------------------------------------------------------
        | Find STUDENT Registration Link
        |--------------------------------------------------------------------------
        */

        $link = StudentRegistrationLink::query()
            ->where(
                'token',
                $token
            )
            ->first();

        /*
        |--------------------------------------------------------------------------
        | Invalid / Disabled / Expired Link
        |--------------------------------------------------------------------------
        */

        if (
            ! $link ||
            ! $link->isAvailable()
        ) {
            return redirect()
                ->route(
                    'student-registration.show',
                    [
                        'token' => $token,
                    ]
                )
                ->withErrors([
                    'registration' => 'This student registration link is invalid, disabled, or expired.',
                ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent Duplicate Registration
        |--------------------------------------------------------------------------
        */

        $existingRegistration =
            StudentRegistration::query()
                ->where(
                    'instructor_id',
                    $link->instructor_id
                )
                ->where(
                    'student_id',
                    $student->id
                )
                ->first();

        /*
         * If the student is already registered with this
         * instructor, do not create another record.
         */
        if ($existingRegistration) {
            return redirect()
                ->route(
                    'student-registration.show',
                    [
                        'token' => $token,
                    ]
                )
                ->with(
                    'success',
                    'You are already registered with this instructor.'
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Validate Student Information
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'course' => ['required', 'string', 'max:255'],
            'full_name' => [
                'required',
                'string',
                'max:255',
            ],

            'student_number' => [
                'required',
                'string',
                'max:100',
            ],

            'year_level' => [
                'required',
                'string',
                'max:100',
            ],

            'section' => [
                'required',
                'string',
                'max:100',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Normalize Values
        |--------------------------------------------------------------------------
        */

        $fullName =
            trim(
                $validated['full_name']
            );

        $studentNumber =
            trim(
                $validated['student_number']
            );

        $yearLevel =
            trim(
                $validated['year_level']
            );

        $section =
            trim(
                $validated['section']
            );

        /*
        |--------------------------------------------------------------------------
        | Prevent Duplicate Student Number
        |--------------------------------------------------------------------------
        |
        | This check is ONLY inside registrations for this instructor.
        |
        */

        $studentNumberExists =
            StudentRegistration::query()
                ->where(
                    'instructor_id',
                    $link->instructor_id
                )
                ->where(
                    'student_number',
                    $studentNumber
                )
                ->where(
                    'student_id',
                    '!=',
                    $student->id
                )
                ->exists();

        if ($studentNumberExists) {
            return back()
                ->withErrors([
                    'student_number' => 'This student number is already registered under this instructor.',
                ])
                ->withInput();
        }

        /*
        |--------------------------------------------------------------------------
        | Save Student Registration
        |--------------------------------------------------------------------------
        */

        try {
            DB::transaction(
                function () use (
                    $student,
                    $link,
                    $fullName,
                    $studentNumber,
                    $yearLevel,
                    $section,
                    $validated
                ): void {
                    $locked = StudentRegistrationLink::whereKey($link->id)->lockForUpdate()->firstOrFail();
                    if (! $locked->isAvailable() || $locked->token !== $link->token) {
                        throw ValidationException::withMessages(['registration' => 'This registration link is no longer available.']);
                    }
                    if (StudentRegistration::where('instructor_id', $link->instructor_id)->where('student_id', $student->id)->exists()) {
                        return;
                    }
                    if (StudentRegistration::where('instructor_id', $link->instructor_id)->where('student_number', $studentNumber)->exists()) {
                        throw ValidationException::withMessages(['student_number' => 'This student number is already registered with this instructor.']);
                    }
                    /*
                    |--------------------------------------------------------------------------
                    | Update Student Profile
                    |--------------------------------------------------------------------------
                    |
                    | Student Registration owns these fields.
                    |
                    */

                    $student->update([
                        'name' => $fullName,

                        'student_id' => $studentNumber,

                        'year' => $yearLevel,

                        'section' => $section,
                    ]);

                    /*
                    |--------------------------------------------------------------------------
                    | Create STUDENT Registration Record
                    |--------------------------------------------------------------------------
                    |
                    | This saves the relationship between:
                    |
                    | Instructor
                    | +
                    | Student
                    |
                    | It does NOT attach the student to a Schedule.
                    |
                    */

                    StudentRegistration::create([
                        'full_name' => $fullName,
                        'email' => $validated['email'],
                        'course' => $validated['course'],
                        'registration_link_id' => $link->id,

                        'instructor_id' => $link->instructor_id,

                        'student_id' => $student->id,

                        'student_number' => $studentNumber,

                        'year_level' => $yearLevel,

                        'section' => $section,

                        'status' => 'active',

                        'registered_at' => now(
                            'Asia/Manila'
                        ),
                    ]);
                }
            );

        } catch (ValidationException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            report($exception);

            return back()->withErrors(['registration' => 'Registration could not be saved. Please try again.']);
        }
        /*
        |--------------------------------------------------------------------------
        | Success
        |--------------------------------------------------------------------------
        */

        return redirect()
            ->route(
                'student-registration.show',
                [
                    'token' => $token,
                ]
            )
            ->with(
                'success',
                'Student information registered successfully.'
            );
    }
}
