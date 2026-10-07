<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StudentPortalController extends Controller
{
    /**
     * Student schedule page.
     *
     * Classes are taken from:
     * 1. Classes explicitly registered by the student
     * 2. Classes assigned to the student's section
     *
     * Duplicate classes are removed automatically.
     */
    public function schedules(Request $request): Response
    {
        $student = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Registered classes
        |--------------------------------------------------------------------------
        */

        $registeredSchedules = $student
            ->registeredSchedules()
            ->get([
                'schedules.id',
                'schedules.subject',
                'schedules.section',
                'schedules.instructor',
                'schedules.start_time',
                'schedules.end_time',
                'schedules.location',
                'schedules.days',
            ]);

        /*
        |--------------------------------------------------------------------------
        | Section classes
        |--------------------------------------------------------------------------
        |
        | This makes sure a class still appears when the instructor created it
        | for the student's section even if the registration pivot is missing.
        |
        */

        $sectionSchedules = collect();

        if (
            $student->section !== null &&
            trim((string) $student->section) !== ''
        ) {
            $section = trim((string) $student->section);

            $sectionSchedules = Schedule::query()
                ->where(function ($query) use ($section) {
                    $query
                        ->whereRaw(
                            'LOWER(TRIM(section)) = ?',
                            [strtolower($section)]
                        )
                        ->orWhereNull('section');
                })
                ->get([
                    'id',
                    'subject',
                    'section',
                    'instructor',
                    'start_time',
                    'end_time',
                    'location',
                    'days',
                ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Combine classes
        |--------------------------------------------------------------------------
        */

        $schedules = $registeredSchedules
            ->concat($sectionSchedules)
            ->unique('id')
            ->sortBy(function (Schedule $schedule) {
                return sprintf(
                    '%s-%s',
                    $schedule->subject ?? '',
                    $schedule->start_time ?? ''
                );
            })
            ->values()
            ->map(function (Schedule $schedule): array {
                return [
                    'id' => $schedule->id,

                    'subject' => $schedule->subject,

                    'section' => $schedule->section,

                    'instructor' => $schedule->instructor,

                    'start_time' => $schedule->start_time,

                    'end_time' => $schedule->end_time,

                    'location' => $schedule->location,

                    /*
                     * Always return normalized days:
                     *
                     * Mon
                     * Tue
                     * Wed
                     * Thu
                     * Fri
                     * Sat
                     * Sun
                     */
                    'days' => $this->normalizeDays(
                        $schedule->days
                    ),
                ];
            });

        return Inertia::render('student/Schedules', [
            'schedules' => $schedules,
        ]);
    }

    /**
     * Student profile.
     */
    public function profile(Request $request): Response
    {
        return Inertia::render('student/Profile', [
            'student' => $request->user()->only([
                'name',
                'email',
                'student_id',
                'course',
                'year',
                'section',
                'adviser', 'profile_picture_url',
            ]),
        ]);
    }

    /**
     * Edit profile.
     */
    public function editProfile(
        Request $request
    ): Response {
        return Inertia::render(
            'student/Profile/Edit',
            [
                'student' => $request->user()->only([
                    'name',
                    'email',
                    'student_id',
                    'course',
                    'year',
                    'section',
                ]),
            ]
        );
    }

    /**
     * Update profile.
     */
    public function updateProfile(
        Request $request
    ): RedirectResponse {
        $user = $request->user();

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class)
                    ->ignore($user->id),
            ],
            'student_id' => ['required', 'string', 'max:100'],
            'course' => ['required', 'string', 'max:255'],
            'year' => ['required', 'string', 'max:100'],
            'section' => ['required', 'string', 'max:100'],
        ]);

        $user->fill($validated);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return to_route('student.profile')
            ->with(
                'success',
                'Profile updated successfully.'
            );
    }

    /**
     * Normalize schedule days.
     *
     * Supports:
     * Monday / Mon
     * Tuesday / Tue
     * Wednesday / Wed
     * Thursday / Thu
     * Friday / Fri
     * Saturday / Sat
     * Sunday / Sun
     */
    private function normalizeDays(
        array|string|null $days
    ): array {
        if ($days === null) {
            return [];
        }

        if (! is_array($days)) {
            $decoded = json_decode(
                $days,
                true
            );

            if (is_array($decoded)) {
                $days = $decoded;
            } else {
                $days = explode(
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

        return collect($days)
            ->map(function ($day) use ($aliases) {
                $key = strtolower(
                    trim((string) $day)
                );

                return $aliases[$key] ?? null;
            })
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
