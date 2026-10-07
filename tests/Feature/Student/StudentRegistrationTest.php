<?php

namespace Tests\Feature\Student;

use App\Models\StudentRegistrationLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentRegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function link(): StudentRegistrationLink
    {
        return StudentRegistrationLink::create([
            'instructor_id' => User::factory()->create(['role' => 'instructor'])->id,
            'token' => str_repeat('b', 64), 'is_active' => true,
        ]);
    }

    public function test_student_can_open_and_submit_general_registration_without_class_enrollment(): void
    {
        $link = $this->link();
        $student = User::factory()->create(['role' => 'student', 'course' => 'BSIT', 'adviser' => 'Dr. Teacher']);
        $this->actingAs($student)->get('/student/registration')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('student/StudentRegistration')->where('student.course', 'BSIT')->where('token', null));
        $this->post('/student/registration/validate', ['token' => $link->token])
            ->assertRedirect('/student-registration/'.$link->token);
        $payload = ['token' => $link->token, 'full_name' => 'Registered Name', 'student_number' => '2026-1', 'email' => 'registration@example.com', 'course' => 'BSIT', 'year_level' => '2nd Year', 'section' => 'A', 'student_id' => 999];
        $this->post('/student/registration', $payload)->assertSessionHasNoErrors();
        $this->post('/student/registration', $payload)->assertSessionHasNoErrors();
        $this->assertDatabaseCount('student_registrations', 1);
        $this->assertDatabaseCount('schedule_student', 0);
        $this->assertSame('Dr. Teacher', $student->refresh()->adviser);
        $this->assertDatabaseHas('student_registrations', ['student_id' => $student->id, 'adviser_name' => null, 'email' => 'registration@example.com', 'full_name' => 'Registered Name']);
        $this->get('/student-registration/'.$link->token)->assertInertia(fn (Assert $page) => $page->where('alreadyRegistered', true)->missing('registration.adviserName'));
    }

    public function test_invalid_disabled_expired_and_regenerated_tokens_are_rejected(): void
    {
        $link = $this->link();
        $this->actingAs(User::factory()->create(['role' => 'student']));
        $this->post('/student/registration/validate', ['token' => 'missing'])->assertSessionHasErrors('token');
        foreach ([['is_active' => false], ['is_active' => true, 'expires_at' => now()->subMinute()], ['expires_at' => null, 'token' => 'new-token']] as $changes) {
            $link->update($changes);
            $this->post('/student/registration/validate', ['token' => str_repeat('b', 64)])->assertSessionHasErrors('token');
            $this->post('/student/registration', ['token' => str_repeat('b', 64)])->assertSessionHasErrors('registration');
        }
        $this->assertDatabaseCount('student_registrations', 0);
    }

    public function test_required_fields_email_and_role_are_validated(): void
    {
        $link = $this->link();
        $this->actingAs(User::factory()->create(['role' => 'student']))
            ->post('/student/registration', ['token' => $link->token, 'email' => 'invalid'])
            ->assertSessionHasErrors(['full_name', 'student_number', 'email', 'course', 'year_level', 'section']);
        $this->actingAs(User::factory()->create(['role' => 'instructor']))
            ->get('/student/registration')->assertRedirect(route('dashboard'));
        $this->postJson('/student/registration', ['token' => $link->token])->assertForbidden();
        $this->assertDatabaseCount('student_registrations', 0);
    }
}
