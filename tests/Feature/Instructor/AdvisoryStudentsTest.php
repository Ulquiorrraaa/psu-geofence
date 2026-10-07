<?php

namespace Tests\Feature\Instructor;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdvisoryStudentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_assignment_populates_only_the_selected_instructors_list_and_can_be_reassigned(): void
    {
        config(['inertia.ssr.enabled' => false]);
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'Active']);
        $owner = User::factory()->create(['role' => 'instructor', 'name' => 'Same Name', 'status' => 'Active']);
        $other = User::factory()->create(['role' => 'instructor', 'name' => 'Same Name', 'status' => 'Active']);
        $student = User::factory()->create(['role' => 'student', 'year' => '1st Year', 'section' => '1A']);
        User::factory()->create(['role' => 'student', 'year' => '2nd Year', 'section' => '2B']);
        $payload = ['year' => '1st Year', 'section' => '1A', 'instructor_id' => $owner->id];
        $this->actingAs($admin)->put(route('admin.users.assign-adviser'), $payload)->assertSessionHasNoErrors();
        $this->assertSame($owner->id, $student->fresh()->adviser_id);
        $this->actingAs($owner)->get('/instructor/advisory-students')->assertOk()->assertInertia(fn (Assert $page) => $page->component('instructor/AdvisoryStudents')->has('students', 1)->where('students.0.id', $student->id)->missing('students.0.password'));
        $this->actingAs($other)->get('/instructor/advisory-students')->assertInertia(fn (Assert $page) => $page->has('students', 0));
        $owner->update(['name' => 'Renamed Instructor']);
        $this->actingAs($owner)->get('/instructor/advisory-students')->assertInertia(fn (Assert $page) => $page->has('students', 1));
        $payload['instructor_id'] = $other->id;
        $this->actingAs($admin)->put(route('admin.users.assign-adviser'), $payload)->assertSessionHasNoErrors();
        $this->actingAs($owner)->get('/instructor/advisory-students')->assertInertia(fn (Assert $page) => $page->has('students', 0));
        $this->actingAs($other)->get('/instructor/advisory-students')->assertInertia(fn (Assert $page) => $page->has('students', 1));
    }

    public function test_other_roles_cannot_access_advisory_lists(): void
    {
        foreach (['student', 'guard', 'admin'] as $role) {
            $user = User::factory()->create(['role' => $role, 'status' => 'Active']);
            $this->actingAs($user)->getJson('/instructor/advisory-students')->assertForbidden();
        }
        auth()->logout();
        $this->get('/instructor/advisory-students')->assertRedirect('/login');
    }
}
