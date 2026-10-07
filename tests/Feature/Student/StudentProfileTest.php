<?php

namespace Tests\Feature\Student;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentProfileTest extends TestCase
{
    use RefreshDatabase;

    private function details(User $student): array
    {
        return [
            'name' => 'Updated Student', 'student_id' => '2026-123',
            'email' => $student->email, 'course' => 'BSIT',
            'year' => '3rd Year', 'section' => 'B',
        ];
    }

    public function test_profile_loads_and_updates_only_the_authenticated_student(): void
    {
        $student = User::factory()->create(['role' => 'student', 'adviser' => 'School Assigned']);
        $other = User::factory()->create(['role' => 'student', 'name' => 'Other Student']);
        $this->actingAs($student)->get('/student/profile/edit')
            ->assertInertia(fn (Assert $page) => $page
                ->component('student/Profile/Edit')
                ->where('student.email', $student->email)
                ->has('student.student_id')->has('student.course')
                ->has('student.year')->has('student.section')
                ->missing('student.password')->missing('auth.user.password'));

        $this->patch('/student/profile', [
            ...$this->details($student), 'id' => $other->id,
            'adviser' => 'Student Supplied', 'role' => 'admin',
        ])->assertSessionHasNoErrors()->assertRedirect('/student/profile')
            ->assertSessionHas('success', 'Profile updated successfully.');
        $this->assertDatabaseHas('users', ['id' => $student->id, ...$this->details($student)]);
        $this->assertSame('School Assigned', $student->refresh()->adviser);
        $this->assertSame('student', $student->role);
        $this->assertSame('Other Student', $other->refresh()->name);
        $this->get('/student/profile')->assertInertia(fn (Assert $page) => $page
            ->where('student.name', 'Updated Student')->where('student.section', 'B'));
    }

    public function test_profile_rejects_duplicate_email_and_missing_fields(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $other = User::factory()->create();
        $this->actingAs($student)->patch('/student/profile', [
            ...$this->details($student), 'email' => $other->email,
        ])->assertSessionHasErrors('email');
        $this->patch('/student/profile', [])->assertSessionHasErrors([
            'name', 'student_id', 'email', 'course', 'year', 'section',
        ]);
    }

    public function test_existing_password_endpoint_hashes_password_and_preserves_student_session(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $other = User::factory()->create(['role' => 'student']);
        $this->actingAs($student)->from('/student/profile/edit')
            ->put('/settings/password', [
                'current_password' => 'password', 'password' => 'New-password-123!',
                'password_confirmation' => 'New-password-123!', 'id' => $other->id,
            ])->assertSessionHasNoErrors()->assertRedirect('/student/profile/edit');
        $this->assertTrue(Hash::check('New-password-123!', $student->refresh()->password));
        $this->assertNotSame('New-password-123!', $student->password);
        $this->assertTrue(Hash::check('password', $other->refresh()->password));
        $this->assertAuthenticatedAs($student);
        $this->get('/student/profile/edit')->assertOk();
    }

    public function test_password_rejects_wrong_current_password_mismatch_and_short_password(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $this->actingAs($student)->from('/student/profile/edit');
        foreach ([
            ['wrong', 'New-password-123!', 'New-password-123!', 'current_password'],
            ['password', 'New-password-123!', 'Different-password-123!', 'password'],
            ['password', 'short', 'short', 'password'],
        ] as [$current, $password, $confirmation, $error]) {
            $this->put('/settings/password', [
                'current_password' => $current, 'password' => $password,
                'password_confirmation' => $confirmation,
            ])->assertSessionHasErrors($error);
            $this->assertTrue(Hash::check('password', $student->refresh()->password));
        }
    }
}
