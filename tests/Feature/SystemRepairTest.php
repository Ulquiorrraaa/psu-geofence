<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\StudentRegistrationLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SystemRepairTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Date::setTestNow(Date::parse('2026-10-06 09:05:00', 'Asia/Manila'));
    }

    protected function tearDown(): void
    {
        Date::setTestNow();
        parent::tearDown();
    }

    private function schedule(User $owner, array $overrides = []): Schedule
    {
        return Schedule::create(array_merge([
            'user_id' => $owner->id, 'subject' => 'Biology', 'instructor' => $owner->name,
            'start_time' => '09:00:00', 'end_time' => '10:00:00', 'students' => 25,
            'location' => 'Room 1', 'coordinates' => '14.5995, 120.9842', 'radius' => '50',
            'days' => ['Tuesday'], 'status' => 'Scheduled', 'recording' => true,
        ], $overrides));
    }

    private function checkIn(Schedule $schedule, array $overrides = []): array
    {
        return array_merge(['schedule_id' => $schedule->id, 'latitude' => 14.5995, 'longitude' => 120.9842], $overrides);
    }

    public function test_public_registration_cannot_create_a_privileged_account(): void
    {
        $this->post('/register', [
            'name' => 'Attacker', 'email' => 'attacker@example.com', 'role' => 'instructor',
            'password' => 'password', 'password_confirmation' => 'password',
        ])->assertSessionHasErrors('role');
        $this->assertDatabaseMissing('users', ['email' => 'attacker@example.com']);
    }

    public function test_unverified_student_can_access_the_dashboard(): void
    {
        $student = User::factory()->unverified()->create(['role' => 'student']);
        $this->actingAs($student)->get('/student/dashboard')->assertOk();
    }

    public function test_inactive_account_cannot_log_in(): void
    {
        $student = User::factory()->create(['role' => 'student', 'status' => 'Inactive']);
        $this->post('/login', ['email' => $student->email, 'password' => 'password'])->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_student_api_login_creates_and_logout_revokes_a_working_token(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $response = $this->postJson('/api/student/login', ['email' => $student->email, 'password' => 'password']);
        $response->assertOk()->assertJsonMissingPath('user.password');
        $token = $response->json('token');
        $this->withToken($token)->getJson('/api/student/profile')->assertOk()->assertJsonPath('user.id', $student->id);
        $this->withToken($token)->postJson('/api/student/logout')->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_student_api_rejects_a_non_student_token(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'instructor']));
        $this->getJson('/api/student/schedules')->assertForbidden();
    }

    public function test_student_api_requires_authentication(): void
    {
        $this->getJson('/api/student/schedules')->assertUnauthorized();
    }

    public function test_api_schedule_list_is_scoped_and_does_not_leak_registration_tokens(): void
    {
        $owner = User::factory()->create(['role' => 'instructor']);
        $student = User::factory()->create(['role' => 'student']);
        $owned = $this->schedule($owner);
        $this->schedule($owner, ['subject' => 'Private class']);
        $owned->registeredStudents()->attach($student);
        Sanctum::actingAs($student);
        $this->getJson('/api/student/schedules')->assertOk()->assertJsonCount(1, 'schedules')
            ->assertJsonPath('schedules.0.id', $owned->id)->assertJsonMissingPath('schedules.0.registration_token');
    }

    public function test_check_in_rejects_a_student_who_is_not_enrolled(): void
    {
        $schedule = $this->schedule(User::factory()->create(['role' => 'instructor']));
        $student = User::factory()->create(['role' => 'student']);
        $this->actingAs($student)->postJson('/student/attendance/check-in', $this->checkIn($schedule))->assertForbidden();
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_check_in_rejects_outside_locations_and_invalid_coordinates(): void
    {
        $schedule = $this->schedule(User::factory()->create(['role' => 'instructor']));
        $student = User::factory()->create(['role' => 'student']);
        $schedule->registeredStudents()->attach($student);
        $this->actingAs($student)->postJson('/student/attendance/check-in', $this->checkIn($schedule, ['latitude' => 15]))
            ->assertUnprocessable()->assertJsonPath('inside_geofence', false);
        $this->postJson('/student/attendance/check-in', $this->checkIn($schedule, ['latitude' => 91]))
            ->assertUnprocessable()->assertJsonValidationErrors('latitude');
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_check_in_requires_recording_and_the_correct_day_and_time(): void
    {
        $schedule = $this->schedule(User::factory()->create(['role' => 'instructor']), ['recording' => false]);
        $student = User::factory()->create(['role' => 'student']);
        $schedule->registeredStudents()->attach($student);
        $this->actingAs($student)->postJson('/student/attendance/check-in', $this->checkIn($schedule))->assertUnprocessable();
        $schedule->update(['recording' => true, 'days' => ['Monday']]);
        $this->postJson('/student/attendance/check-in', $this->checkIn($schedule))->assertUnprocessable();
        $schedule->update(['days' => ['Tuesday'], 'end_time' => '09:00:00']);
        $this->postJson('/student/attendance/check-in', $this->checkIn($schedule))->assertUnprocessable();
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_repeated_check_in_preserves_the_first_time_and_present_status(): void
    {
        $schedule = $this->schedule(User::factory()->create(['role' => 'instructor']));
        $student = User::factory()->create(['role' => 'student']);
        $schedule->registeredStudents()->attach($student);
        $this->actingAs($student)->postJson('/student/attendance/check-in', $this->checkIn($schedule))
            ->assertOk()->assertJsonPath('status', 'present')->assertJsonPath('time_in', '09:05');
        Date::setTestNow(Date::parse('2026-10-06 09:25:00', 'Asia/Manila'));
        $this->postJson('/student/attendance/check-in', $this->checkIn($schedule))
            ->assertOk()->assertJsonPath('status', 'present')->assertJsonPath('time_in', '09:05');
        $this->assertDatabaseCount('attendances', 1);
    }

    public function test_api_check_in_uses_the_same_geofence_rules(): void
    {
        $schedule = $this->schedule(User::factory()->create(['role' => 'instructor']));
        $student = User::factory()->create(['role' => 'student']);
        $schedule->registeredStudents()->attach($student);
        Sanctum::actingAs($student);
        $this->postJson('/api/student/attendance', $this->checkIn($schedule, ['latitude' => 15]))->assertUnprocessable();
        $this->postJson('/api/student/attendance', $this->checkIn($schedule))->assertOk();
        $this->assertDatabaseCount('attendances', 1);
    }

    public function test_manual_attendance_is_persistent_and_scoped_to_owner_and_enrollment(): void
    {
        $owner = User::factory()->create(['role' => 'instructor']);
        $schedule = $this->schedule($owner);
        $student = User::factory()->create(['role' => 'student']);
        $schedule->registeredStudents()->attach($student);
        $payload = ['student_id' => $student->id, 'schedule_id' => $schedule->id, 'attendance_date' => '2026-09-29', 'status' => 'late'];
        $this->actingAs($owner)->post('/attendance', $payload)->assertSessionHasNoErrors()->assertRedirect();
        $this->assertDatabaseHas('attendances', ['schedule_id' => $schedule->id, 'student_id' => $student->id, 'status' => 'Late']);
        $this->actingAs(User::factory()->create(['role' => 'instructor']))->post('/attendance', $payload)->assertForbidden();
        $this->actingAs($owner)->post('/attendance', array_merge($payload, ['student_id' => User::factory()->create(['role' => 'student'])->id]))->assertForbidden();
        $this->assertDatabaseCount('attendances', 1);
    }

    public function test_manual_attendance_cannot_overwrite_gps_records_or_future_dates(): void
    {
        $owner = User::factory()->create(['role' => 'instructor']);
        $schedule = $this->schedule($owner);
        $student = User::factory()->create(['role' => 'student']);
        $schedule->registeredStudents()->attach($student);
        $this->actingAs($student)->postJson('/student/attendance/check-in', $this->checkIn($schedule))->assertOk();
        $payload = ['student_id' => $student->id, 'schedule_id' => $schedule->id, 'attendance_date' => '2026-10-06', 'status' => 'absent'];
        $this->actingAs($owner)->post('/attendance', $payload)->assertSessionHasErrors('status');
        $this->post('/attendance', array_merge($payload, ['attendance_date' => '2026-10-07']))->assertSessionHasErrors('attendance_date');
        $this->post('/attendance', array_merge($payload, ['status' => null]))->assertSessionHasErrors('status');
        $record = Attendance::where('student_id', $student->id)->firstOrFail();
        $this->delete('/attendance/'.$record->id)->assertSessionHasErrors('status');
        $this->assertDatabaseHas('attendances', ['id' => $record->id, 'status' => 'Present', 'latitude' => 14.5995, 'longitude' => 120.9842]);
    }

    public function test_attendance_sheet_has_real_roster_and_class_scoped_records(): void
    {
        $owner = User::factory()->create(['role' => 'instructor']);
        $schedule = $this->schedule($owner);
        $student = User::factory()->create(['role' => 'student']);
        $schedule->registeredStudents()->attach($student);
        $this->actingAs($student)->postJson('/student/attendance/check-in', $this->checkIn($schedule))->assertOk();
        $this->actingAs($owner)->get('/attendance/create')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('instructor/CreateAttendance')->has('students', 1)->has('subjects', 1)
            ->where('attendance.0.schedule_id', $schedule->id)->where('attendance.0.status', 'present_gps'));
    }

    public function test_registration_link_response_matches_the_frontend_contract(): void
    {
        $owner = User::factory()->create(['role' => 'instructor']);
        $schedule = $this->schedule($owner);
        $student = User::factory()->create(['role' => 'student']);
        $schedule->registeredStudents()->attach($student);
        $this->actingAs($owner)->getJson("/instructor/classes/{$schedule->id}/registration-link")
            ->assertOk()->assertJsonPath('registration.registeredCount', 1)->assertJsonPath('registration.isActive', true)
            ->assertJsonPath('students.0.id', $student->id);
        $this->actingAs(User::factory()->create(['role' => 'instructor']))
            ->getJson("/instructor/classes/{$schedule->id}/registration-link")->assertForbidden();
    }

    public function test_admin_schedule_creation_is_blocked(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $owner = User::factory()->create(['role' => 'instructor']);
        $payload = ['instructor_id' => $owner->id, 'subject' => 'Biology', 'start_time' => '09:00', 'end_time' => '10:00',
            'students' => 25, 'location' => 'Room 1', 'coordinates' => '14.5995, 120.9842', 'radius' => 50, 'days' => ['Tuesday'], 'status' => 'Scheduled'];
        $this->actingAs($admin)->post('/admin/schedules', $payload)->assertForbidden();
        $this->postJson('/schedules', $payload)->assertForbidden();
        $this->assertDatabaseCount('schedules', 0);
    }

    public function test_instructor_schedule_creation_always_uses_the_authenticated_owner(): void
    {
        $owner = User::factory()->create(['role' => 'instructor', 'status' => 'Active']);
        $other = User::factory()->create(['role' => 'instructor', 'status' => 'Active']);
        $payload = ['user_id' => $other->id, 'instructor_id' => $other->id, 'subject' => 'Biology',
            'start_time' => '09:00', 'end_time' => '10:00', 'students' => 25, 'location' => 'Room 1',
            'coordinates' => '14.5995, 120.9842', 'radius' => 50, 'days' => ['Tuesday'], 'status' => 'Scheduled'];
        $this->actingAs($owner)->post('/schedules', $payload)->assertSessionHasNoErrors()->assertRedirect();
        $this->assertDatabaseHas('schedules', ['subject' => 'Biology', 'user_id' => $owner->id, 'instructor' => $owner->name]);
        $this->assertDatabaseMissing('schedules', ['user_id' => $other->id]);
        foreach (['student', 'guard'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role, 'status' => 'Active']))->postJson('/schedules', $payload)->assertForbidden();
        }
        $this->assertDatabaseCount('schedules', 1);
    }

    public function test_reports_use_actual_records_and_apply_date_and_status_filters(): void
    {
        $owner = User::factory()->create(['role' => 'instructor']);
        $schedule = $this->schedule($owner);
        $student = User::factory()->create(['role' => 'student']);
        foreach ([['2026-10-06', 'present'], ['2026-10-05', 'late'], ['2026-09-30', 'absent']] as [$date, $status]) {
            Attendance::create(['student_id' => $student->id, 'schedule_id' => $schedule->id, 'attendance_date' => $date, 'status' => $status]);
        }
        $this->actingAs(User::factory()->create(['role' => 'admin']))->get('/admin/reports')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/Reports')->where('reportStats.totalRecords', 2)
                ->where('classRates.0.present', 1)->where('classRates.0.late', 1));
        $this->get('/admin/reports?dateRange=Today')->assertInertia(fn (Assert $page) => $page->where('reportStats.totalRecords', 1));
        $this->get('/admin/reports?reportType=Late%20Students')->assertInertia(fn (Assert $page) => $page->where('reportStats.totalRecords', 1));
        $this->get('/admin/attendance')->assertOk()->assertInertia(fn (Assert $page) => $page->has('instructorAttendanceRecords', 3));
    }

    public function test_admin_can_update_accounts_and_preserve_or_replace_passwords(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'Active']);
        $student = User::factory()->create(['role' => 'student']);
        $payload = ['name' => 'Updated Name', 'email' => $student->email, 'role' => 'student', 'status' => 'Inactive', 'password' => ''];
        $this->actingAs($admin)->put("/admin/users/{$student->id}", $payload)->assertSessionHasNoErrors();
        $this->assertSame('Updated Name', $student->refresh()->name);
        $this->assertTrue(Hash::check('password', $student->password));
        $this->put("/admin/users/{$student->id}", array_merge($payload, ['password' => 'replacement-password']))->assertSessionHasNoErrors();
        $this->assertTrue(Hash::check('replacement-password', $student->refresh()->password));
        $this->put("/admin/users/{$admin->id}", array_merge($payload, ['email' => $admin->email]))->assertSessionHasErrors('role');
        $this->delete("/admin/users/{$admin->id}")->assertSessionHasErrors('user');
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_admin_can_update_and_delete_schedules_but_students_cannot(): void
    {
        $owner = User::factory()->create(['role' => 'instructor']);
        $schedule = $this->schedule($owner);
        $admin = User::factory()->create(['role' => 'admin']);
        $payload = ['instructor_id' => $owner->id, 'subject' => 'Updated Biology', 'start_time' => '09:00', 'end_time' => '10:00',
            'students' => 25, 'location' => 'Room 1', 'coordinates' => '14.5995, 120.9842', 'radius' => 50, 'days' => ['Tuesday']];
        $this->actingAs($admin)->put("/admin/schedules/{$schedule->id}", $payload)->assertSessionHasNoErrors();
        $this->assertSame('Updated Biology', $schedule->refresh()->subject);
        $this->actingAs(User::factory()->create(['role' => 'student']))->deleteJson("/admin/schedules/{$schedule->id}")->assertForbidden();
        $this->actingAs($admin)->delete("/admin/schedules/{$schedule->id}")->assertRedirect();
        $this->assertDatabaseMissing('schedules', ['id' => $schedule->id]);
    }

    public function test_manual_attendance_can_be_updated_and_cleared_without_duplicate_rows(): void
    {
        $owner = User::factory()->create(['role' => 'instructor']);
        $schedule = $this->schedule($owner);
        $student = User::factory()->create(['role' => 'student']);
        $schedule->registeredStudents()->attach($student);
        $payload = ['student_id' => $student->id, 'schedule_id' => $schedule->id, 'attendance_date' => '2026-09-29', 'status' => 'present'];
        $this->actingAs($owner)->post('/attendance', $payload)->assertSessionHasNoErrors();
        $this->post('/attendance', array_merge($payload, ['status' => 'late']))->assertSessionHasNoErrors();
        $this->assertDatabaseCount('attendances', 1);
        $this->assertDatabaseHas('attendances', ['status' => 'Late']);
        $this->post('/attendance', array_merge($payload, ['status' => null]))->assertSessionHasNoErrors();
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_class_registration_is_persistent_idempotent_and_respects_disabled_links(): void
    {
        $schedule = $this->schedule(User::factory()->create(['role' => 'instructor']));
        $student = User::factory()->create(['role' => 'student', 'student_id' => 'STU-001', 'year' => '1st Year', 'section' => 'A']);
        $this->actingAs($student)->post('/student/register-class/'.$schedule->registration_token)->assertSessionHasNoErrors();
        $this->post('/student/register-class/'.$schedule->registration_token)->assertSessionHasNoErrors();
        $this->assertDatabaseCount('schedule_student', 1);
        $schedule->update(['registration_enabled' => false]);
        $this->actingAs(User::factory()->create(['role' => 'student', 'student_id' => 'STU-002', 'year' => '1st Year', 'section' => 'A']))
            ->post('/student/register-class/'.$schedule->registration_token)->assertSessionHasErrors('registration');
        $this->assertDatabaseCount('schedule_student', 1);
    }

    public function test_student_information_registration_updates_the_profile_without_enrolling_in_classes(): void
    {
        $owner = User::factory()->create(['role' => 'instructor']);
        $link = StudentRegistrationLink::create(['instructor_id' => $owner->id, 'token' => str_repeat('a', 64), 'is_active' => true]);
        $student = User::factory()->create(['role' => 'student']);
        $payload = ['email' => 'student@example.com', 'course' => 'BSIT', 'adviser_name' => 'Professor One', 'full_name' => 'Student One', 'student_number' => 'STU-001', 'year_level' => '1st Year', 'section' => 'A'];
        $this->actingAs($student)->post('/student-registration/'.$link->token, $payload)->assertSessionHasNoErrors();
        $this->post('/student-registration/'.$link->token, $payload)->assertSessionHasNoErrors();
        $this->assertSame('STU-001', $student->refresh()->student_id);
        $this->assertDatabaseCount('student_registrations', 1);
        $this->assertDatabaseCount('schedule_student', 0);
        $this->actingAs(User::factory()->create(['role' => 'student']))
            ->post('/student-registration/'.$link->token, $payload)->assertSessionHasErrors('student_number');
    }

    public function test_guard_pages_display_registered_students_and_actual_attendance(): void
    {
        $schedule = $this->schedule(User::factory()->create(['role' => 'instructor']));
        $student = User::factory()->create(['role' => 'student']);
        $schedule->registeredStudents()->attach($student);
        $this->actingAs($student)->postJson('/student/attendance/check-in', $this->checkIn($schedule))->assertOk();
        $guard = User::factory()->create(['role' => 'guard']);
        $this->actingAs($guard)->get('/guard/dashboard')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('guard/Dashboard')->where('classes.0.studentCount', 1));
        $this->get('/guard/student-tracking')->assertOk();
        $this->get('/guard/classes/'.$schedule->id)->assertOk();
        $this->actingAs($student)->getJson('/guard/classes/'.$schedule->id)->assertForbidden();
    }

    public function test_unverified_api_accounts_can_login_but_inactive_accounts_are_denied(): void
    {
        $student = User::factory()->unverified()->create(['role' => 'student']);
        $this->postJson('/api/student/login', ['email' => $student->email, 'password' => 'password'])->assertOk();
        $student->forceFill(['email_verified_at' => now(), 'status' => 'Inactive'])->save();
        $this->postJson('/api/student/login', ['email' => $student->email, 'password' => 'password'])->assertForbidden();
        Sanctum::actingAs($student);
        $this->getJson('/api/student/dashboard')->assertForbidden();
    }
}
