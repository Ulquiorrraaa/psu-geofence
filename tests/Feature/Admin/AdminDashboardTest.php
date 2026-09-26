<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_visiting_shared_dashboard_path_is_redirected_to_admin_dashboard(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get(route('dashboard'));

        $response->assertRedirect(route('admin.dashboard'));
    }

    public function test_admin_dashboard_route_renders_the_admin_dashboard_page_with_stats(): void
    {
        User::factory()->count(2)->create(['role' => 'student']);
        User::factory()->create(['role' => 'instructor']);
        User::factory()->create(['role' => 'guard']);
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('admin/Dashboard')
            ->where('stats.totalStudents', 2)
            ->where('stats.totalInstructors', 1)
            ->where('stats.totalGuards', 1)
            ->where('weeklyAttendance.0.present', 2)
            ->where('studentTraffic.0.students', 2)
        );
    }

    public function test_admin_can_create_user_with_lowercase_role(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.users'), [
            'name' => 'New Student',
            'email' => 'new.student@example.com',
            'password' => 'password',
            'role' => 'student',
            'status' => 'Active',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'email' => 'new.student@example.com',
            'role' => 'student',
        ]);
    }
}
