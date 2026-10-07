<?php

namespace Tests\Feature\Admin;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PortalImprovementsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_deactivation_preserves_records_and_prevents_self_deactivation(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'Active']);
        $student = User::factory()->create(['role' => 'student', 'status' => 'Active']);
        $this->actingAs($admin)->delete('/admin/users/'.$student->id)->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $student->id, 'status' => 'Inactive']);
        $this->assertDatabaseHas('activity_logs', ['actor_id' => $admin->id, 'action' => 'User deactivated']);
        $this->patch('/admin/users/'.$admin->id.'/status', ['status' => 'Inactive'])->assertStatus(422);
    }

    public function test_profiles_use_the_correct_role_and_reject_cross_portal_access(): void
    {
        foreach (['admin', 'instructor', 'guard'] as $role) {
            $user = User::factory()->create(['role' => $role, 'status' => 'Active']);
            $this->actingAs($user)->get('/'.$role.'/profile')->assertInertia(fn (Assert $page) => $page->component($role.'/Profile'));
            if ($role !== 'admin') {
                $this->get('/admin/classes')->assertStatus(302);
                $this->get('/admin/activity-logs')->assertStatus(302);
                $this->get('/admin/attendance-monitoring')->assertStatus(302);
            }
        }
        $student = User::factory()->create(['role' => 'student', 'status' => 'Active']);
        $this->actingAs($student)->get('/guard/profile')->assertStatus(302);
        $this->get('/instructor/profile')->assertStatus(302);
        $this->get('/admin/users')->assertStatus(302);
    }

    public function test_picture_upload_replacement_removal_and_validation(): void
    {
        Storage::fake('public');
        foreach (['student', 'instructor', 'guard', 'admin'] as $role) {
            $user = User::factory()->create(['role' => $role, 'status' => 'Active']);
            $endpoint = '/'.$role.'/profile/picture';
            $this->actingAs($user)->post($endpoint, ['profile_picture' => UploadedFile::fake()->createWithContent('avatar.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='))])->assertRedirect();
            $old = $user->fresh()->profile_picture;
            Storage::disk('public')->assertExists($old);
            $this->post($endpoint, ['profile_picture' => UploadedFile::fake()->createWithContent('replacement.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='))])->assertRedirect();
            Storage::disk('public')->assertMissing($old);
            $this->post($endpoint, ['profile_picture' => UploadedFile::fake()->create('bad.svg', 10, 'image/svg+xml')])->assertSessionHasErrors('profile_picture');
            $this->post($endpoint, ['profile_picture' => UploadedFile::fake()->createWithContent('large.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='))->size(6000)])->assertSessionHasErrors('profile_picture');
            $this->post($endpoint, ['remove' => true])->assertRedirect();
            $this->assertNull($user->fresh()->profile_picture);
        }
    }

    public function test_monitoring_pages_and_user_details_load(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'Active']);
        $instructor = User::factory()->create(['role' => 'instructor', 'status' => 'Active']);
        $student = User::factory()->create(['role' => 'student']);
        $schedule = Schedule::create(['user_id' => $instructor->id, 'subject' => 'Math', 'instructor' => $instructor->name, 'section' => 'A', 'start_time' => '09:00', 'end_time' => '10:00', 'days' => ['Monday'], 'location' => 'Room 1', 'coordinates' => '14.5995, 120.9842', 'radius' => 50, 'students' => 30, 'status' => 'Scheduled']);
        Attendance::create(['student_id' => $student->id, 'schedule_id' => $schedule->id, 'attendance_date' => now('Asia/Manila')->toDateString(), 'status' => 'Late']);
        $this->actingAs($admin)->get('/admin/classes?status=Scheduled')->assertInertia(fn (Assert $page) => $page->component('admin/Classes')->where('records.total', 1));
        $this->get('/admin/attendance-monitoring?status=Late')->assertInertia(fn (Assert $page) => $page->component('admin/AttendanceMonitoring')->where('records.total', 1));
        $this->get('/admin/users/'.$student->id)->assertInertia(fn (Assert $page) => $page->component('admin/UserDetails')->where('percentage', 100));
        $this->get('/admin/activity-logs')->assertOk();
        $this->get('/admin/dashboard')->assertInertia(fn (Assert $page) => $page->where('stats.lateToday', 1)->where('stats.presentRecordsToday', 0)->where('stats.attendanceRateToday', 100));
    }

    public function test_profile_updates_preserve_role_and_validate_email(): void
    {
        $other = User::factory()->create();
        foreach (['admin', 'instructor', 'guard'] as $role) {
            $user = User::factory()->create(['role' => $role, 'status' => 'Active']);
            $this->actingAs($user)->patch('/'.$role.'/profile', [
                'name' => 'Updated name', 'email' => $user->email, 'phone' => '09123456789',
                'employee_id' => 'EMP-1', 'department' => 'Science', 'assigned_area' => 'Main gate',
                'role' => 'admin', 'status' => 'Inactive',
            ])->assertSessionHasNoErrors()->assertRedirect();
            $this->assertSame('Updated name', $user->fresh()->name);
            $this->assertSame($role, $user->fresh()->role);
            $this->assertSame('Active', $user->fresh()->status);
            $this->patch('/'.$role.'/profile', ['name' => 'Name', 'email' => $other->email])->assertSessionHasErrors('email');
        }
    }

    public function test_admin_registration_views_remain_separate(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'Active']);
        $instructor = User::factory()->create(['role' => 'instructor']);
        $student = User::factory()->create(['role' => 'student']);
        $schedule = Schedule::create(['user_id' => $instructor->id, 'subject' => 'Math', 'instructor' => $instructor->name, 'start_time' => '09:00', 'end_time' => '10:00', 'days' => ['Monday'], 'location' => 'Room 1', 'coordinates' => '14.5995, 120.9842', 'radius' => 50, 'students' => 30, 'status' => 'Scheduled']);
        $schedule->registeredStudents()->attach($student, ['student_number' => 'S001', 'status' => 'active']);
        $this->actingAs($admin)->get('/admin/registrations?kind=classes')->assertInertia(fn (Assert $page) => $page->component('admin/Registrations')->where('records.total', 1)->where('records.data.0.student_number', 'S001'));
        $this->get('/admin/registrations?kind=information')->assertInertia(fn (Assert $page) => $page->component('admin/Registrations')->where('records.total', 0));
    }

    public function test_password_change_is_validated_for_every_role(): void
    {
        foreach (['admin', 'instructor', 'student', 'guard'] as $role) {
            $user = User::factory()->create(['role' => $role, 'status' => 'Active', 'password' => 'password']);
            $this->actingAs($user)->put('/settings/password', ['current_password' => 'wrong', 'password' => 'new-password-123', 'password_confirmation' => 'new-password-123'])->assertSessionHasErrors('current_password');
            $this->put('/settings/password', ['current_password' => 'password', 'password' => 'new-password-123', 'password_confirmation' => 'mismatch'])->assertSessionHasErrors('password');
            $this->put('/settings/password', ['current_password' => 'password', 'password' => 'new-password-123', 'password_confirmation' => 'new-password-123'])->assertSessionHas('success', 'Password updated successfully.');
            $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
        }
    }
}
