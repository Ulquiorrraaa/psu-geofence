<?php

namespace Tests\Feature\Instructor;

use App\Models\StudentRegistration;
use App\Models\StudentRegistrationLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentRegistrationPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_page_supplies_saved_statuses_and_keeps_registrations_scoped_to_instructor(): void
    {
        $instructor = User::factory()->create(['role' => 'instructor']);
        $link = StudentRegistrationLink::create([
            'instructor_id' => $instructor->id,
            'token' => 'instructor-registration-token', 'is_active' => true,
        ]);
        $otherInstructor = User::factory()->create(['role' => 'instructor']);
        $otherLink = StudentRegistrationLink::create([
            'instructor_id' => $otherInstructor->id,
            'token' => 'other-registration-token', 'is_active' => true,
        ]);

        foreach ([
            [$instructor, $link, 'active', 'Active Student', '2026-001'],
            [$instructor, $link, 'inactive', 'Inactive Student', '2026-002'],
            [$otherInstructor, $otherLink, 'active', 'Other Student', '2026-003'],
        ] as [$owner, $registrationLink, $status, $name, $number]) {
            $student = User::factory()->create(['role' => 'student', 'name' => $name]);
            StudentRegistration::create([
                'instructor_id' => $owner->id, 'registration_link_id' => $registrationLink->id,
                'student_id' => $student->id, 'student_number' => $number,
                'year_level' => '2nd Year', 'section' => 'A',
                'status' => $status, 'registered_at' => now(),
            ]);
        }

        $this->actingAs($instructor)->get('/instructor/student-registration')
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('instructor/StudentRegistration')
            ->where('registeredCount', 2)->has('registeredStudents', 2)
            ->where('registeredStudents', function ($students) {
                $students = collect($students)->keyBy('studentNumber');

                return $students['2026-001']['status'] === 'active'
                    && $students['2026-002']['status'] === 'inactive'
                    && $students['2026-001']['name'] === 'Active Student'
                    && $students['2026-002']['name'] === 'Inactive Student';
            }));
        $this->assertDatabaseCount('schedule_student', 0);
    }
}
