<?php

namespace Tests\Feature\Student;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentNavigationTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_navigation_destinations_render_student_pages(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $this->actingAs($student)
            ->get(route('student.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('student/Dashboard'));

        $this->get(route('student.schedules'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('student/Schedules')
                ->has('schedules')
            );

        $this->get(route('student.attendance'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('student/Attendance')
                ->has('attendance')
            );

        $this->get(route('student.profile'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('student/Profile')
                ->where('student.name', $student->name)
            );
    }
}
