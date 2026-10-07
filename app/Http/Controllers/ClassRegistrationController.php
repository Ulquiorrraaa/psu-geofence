<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ClassRegistrationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Register for Class Page
    |--------------------------------------------------------------------------
    */

    public function index(
        Request $request
    ): Response {
        $student =
            $request->user();

        abort_unless(
            $student &&
            $student->role === 'student',
            403,
            'Only students can register for classes.'
        );

        return Inertia::render(
            'student/RegisterClass'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Show Specific Class
    |--------------------------------------------------------------------------
    */

    public function show(
        Request $request,
        string $token
    ): Response {
        $student =
            $request->user();

        abort_unless(
            $student &&
            $student->role === 'student',
            403,
            'Only students can register for classes.'
        );

        /*
        |--------------------------------------------------------------------------
        | Find class using token
        |--------------------------------------------------------------------------
        */

        $schedule = Schedule::query()
            ->with('user')
            ->where(
                'registration_token',
                $token
            )
            ->first();

        /*
        |--------------------------------------------------------------------------
        | Invalid / Disabled / Expired
        |--------------------------------------------------------------------------
        */

        if (
            ! $schedule ||
            ! $schedule->registrationIsAvailable()
        ) {
            return Inertia::render(
                'student/ClassRegistrationUnavailable',
                [
                    'message' => 'This class registration link is invalid, disabled, or expired.',
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Already Registered
        |--------------------------------------------------------------------------
        */

        $alreadyRegistered =
            $schedule
                ->registeredStudents()
                ->where(
                    'users.id',
                    $student->id
                )
                ->exists();

        /*
        |--------------------------------------------------------------------------
        | Show Class Registration Page
        |--------------------------------------------------------------------------
        */

        return Inertia::render(
            'student/ClassRegistration',
            [
                'token' => $token,

                'alreadyRegistered' => $alreadyRegistered,

                'success' => session('success'),

                'classDetails' => [
                    'id' => $schedule->id,

                    'subject' => $schedule->subject,

                    'instructor' => $schedule->instructor
                        ?: $schedule->user?->name
                        ?: 'Not assigned',

                    'section' => $schedule->section,

                    'startTime' => $this->formatTime(
                        $schedule->start_time
                    ),

                    'endTime' => $this->formatTime(
                        $schedule->end_time
                    ),

                    'days' => $this->normalizeDays(
                        $schedule->days
                    ),

                    'location' => $schedule->location,
                ],

                /*
                |--------------------------------------------------------------------------
                | Student Information
                |--------------------------------------------------------------------------
                */

                'student' => [
                    'name' => $student->name,

                    'studentNumber' => $student->student_id,

                    'yearLevel' => $student->year,

                    'section' => $student->section,

                    'email' => $student->email,
                ],
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Register Student to Class
    |--------------------------------------------------------------------------
    */

    public function register(
        Request $request,
        string $token
    ): RedirectResponse {
        $student =
            $request->user();

        abort_unless(
            $student &&
            $student->role === 'student',
            403,
            'Only students can register for classes.'
        );

        /*
        |--------------------------------------------------------------------------
        | Find Class
        |--------------------------------------------------------------------------
        */

        $schedule = Schedule::query()
            ->where(
                'registration_token',
                $token
            )
            ->first();

        /*
        |--------------------------------------------------------------------------
        | Validate Link
        |--------------------------------------------------------------------------
        */

        if (
            ! $schedule ||
            ! $schedule->registrationIsAvailable()
        ) {
            return redirect()
                ->route(
                    'student.class-registration.index'
                )
                ->withErrors([
                    'registration' => 'This class registration link is invalid, disabled, or expired.',
                ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Already Registered
        |--------------------------------------------------------------------------
        */

        $alreadyRegistered =
            $schedule
                ->registeredStudents()
                ->where(
                    'users.id',
                    $student->id
                )
                ->exists();

        if ($alreadyRegistered) {
            return redirect()
                ->route(
                    'student.class-registration.show',
                    [
                        'token' => $token,
                    ]
                )
                ->with(
                    'success',
                    'You are already registered for this class.'
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Student Information Required
        |--------------------------------------------------------------------------
        */

        if (
            empty(
                trim(
                    (string) $student->student_id
                )
            ) ||
            empty(
                trim(
                    (string) $student->year
                )
            ) ||
            empty(
                trim(
                    (string) $student->section
                )
            )
        ) {
            return redirect()
                ->route(
                    'student.class-registration.show',
                    [
                        'token' => $token,
                    ]
                )
                ->withErrors([
                    'registration' => 'Your student information is incomplete. Please complete Student Registration first before joining a class.',
                ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Section Check
        |--------------------------------------------------------------------------
        */

        if (
            $schedule->section !== null &&
            trim(
                (string) $schedule->section
            ) !== ''
        ) {
            $classSection =
                strtolower(
                    trim(
                        (string) $schedule->section
                    )
                );

            $studentSection =
                strtolower(
                    trim(
                        (string) $student->section
                    )
                );

            if (
                $classSection !==
                $studentSection
            ) {
                return redirect()
                    ->route(
                        'student.class-registration.show',
                        [
                            'token' => $token,
                        ]
                    )
                    ->withErrors([
                        'registration' => 'You cannot register for this class because it belongs to section '.
                            $schedule->section.
                            '. Your registered section is '.
                            $student->section.
                            '.',
                    ]);
                if (Schema::hasTable('activity_logs')) {
                    ActivityLog::create([
                        'actor_id' => $student->id, 'actor_name' => $student->name, 'role' => 'student',
                        'action' => 'Student registered for class', 'subject_type' => 'Schedule', 'subject_id' => $schedule->id,
                    ]);
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent Duplicate Student Number
        |--------------------------------------------------------------------------
        */

        $studentNumberExists =
            DB::table(
                'schedule_student'
            )
                ->where(
                    'schedule_id',
                    $schedule->id
                )
                ->where(
                    'student_number',
                    $student->student_id
                )
                ->where(
                    'student_id',
                    '!=',
                    $student->id
                )
                ->exists();

        if ($studentNumberExists) {
            return redirect()
                ->route(
                    'student.class-registration.show',
                    [
                        'token' => $token,
                    ]
                )
                ->withErrors([
                    'registration' => 'Your student number is already being used in this class.',
                ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Register Student
        |--------------------------------------------------------------------------
        */

        DB::transaction(
            function () use (
                $schedule,
                $student
            ): void {
                $locked = Schedule::whereKey($schedule->id)->lockForUpdate()->firstOrFail();
                if (! $locked->registrationIsAvailable() || $locked->registration_token !== $schedule->registration_token) {
                    throw ValidationException::withMessages(['registration' => 'This registration link is no longer available.']);
                }
                if ($locked->registeredStudents()->where('users.id', $student->id)->exists()) {
                    return;
                }
                $schedule
                    ->registeredStudents()
                    ->syncWithoutDetaching([
                        $student->id => [
                            'student_number' => $student->student_id,

                            'year_level' => $student->year,

                            'section' => $student->section,

                            'status' => 'active',

                            'registered_at' => now(
                                'Asia/Manila'
                            ),
                        ],
                    ]);
                if (Schema::hasTable('activity_logs')) {
                    ActivityLog::create([
                        'actor_id' => $student->id, 'actor_name' => $student->name, 'role' => 'student',
                        'action' => 'Student registered for class', 'subject_type' => 'Schedule', 'subject_id' => $schedule->id,
                    ]);
                }
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Success
        |--------------------------------------------------------------------------
        */

        return redirect()
            ->route(
                'student.class-registration.show',
                [
                    'token' => $token,
                ]
            )
            ->with(
                'success',
                'Successfully registered for this class.'
            );
    }

    /*
    |--------------------------------------------------------------------------
    | Format Time
    |--------------------------------------------------------------------------
    */

    private function formatTime(
        ?string $time
    ): string {
        if (! $time) {
            return '';
        }

        return Carbon::parse(
            $time
        )->format(
            'h:i A'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize Days
    |--------------------------------------------------------------------------
    */

    private function normalizeDays(
        array|string|null $days
    ): array {
        if ($days === null) {
            return [];
        }

        if (! is_array($days)) {
            $decoded =
                json_decode(
                    $days,
                    true
                );

            if (is_array($decoded)) {
                $days =
                    $decoded;
            } else {
                $days =
                    explode(
                        ',',
                        $days
                    );
            }
        }

        $aliases = [
            'monday' => 'Mon',
            'mon' => 'Mon',
            'm' => 'Mon',

            'tuesday' => 'Tue',
            'tue' => 'Tue',
            'tues' => 'Tue',

            'wednesday' => 'Wed',
            'wed' => 'Wed',
            'w' => 'Wed',

            'thursday' => 'Thu',
            'thu' => 'Thu',
            'thur' => 'Thu',
            'thurs' => 'Thu',

            'friday' => 'Fri',
            'fri' => 'Fri',
            'f' => 'Fri',

            'saturday' => 'Sat',
            'sat' => 'Sat',

            'sunday' => 'Sun',
            'sun' => 'Sun',
        ];

        return collect(
            $days
        )
            ->map(
                function ($day) use (
                    $aliases
                ) {
                    $key =
                        strtolower(
                            trim(
                                (string) $day
                            )
                        );

                    return $aliases[
                        $key
                    ] ?? null;
                }
            )
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
