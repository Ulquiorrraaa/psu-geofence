<?php

namespace Tests\Feature\Instructor;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\User;
use App\Services\AttendanceAutoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Date;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AutomaticAttendanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // These tests verify server props, without calling the live Vite SSR server.
        config(['inertia.ssr.enabled' => false]);
    }

    protected function tearDown(): void
    {
        Date::setTestNow();
        parent::tearDown();
    }

    private function fixture(): array
    {
        Date::setTestNow(Date::parse('2026-10-05 07:00:00', 'Asia/Manila'));
        $owner = User::factory()->create(['role' => 'instructor']);
        $student = User::factory()->create(['role' => 'student', 'section' => 'A']);
        $schedule = Schedule::create([
            'user_id' => $owner->id, 'subject' => 'Automatic attendance', 'instructor' => $owner->name,
            'start_time' => '08:00:00', 'end_time' => '10:00:00', 'students' => 10,
            'location' => 'Room 1', 'coordinates' => '14.5995000, 120.9842000',
            'radius' => '50', 'days' => ['Mon', 'Wednesday', 'Fri'],
            'status' => 'Scheduled', 'recording' => true,
        ]);
        $schedule->registeredStudents()->attach($student, ['registered_at' => now()]);

        return [$owner, $student, $schedule];
    }

    private function time(string $time): void
    {
        Date::setTestNow(Date::parse($time, 'Asia/Manila'));
    }

    private function checkIn(User $student, Schedule $schedule)
    {
        return $this->actingAs($student)->postJson('/student/attendance/check-in', [
            'schedule_id' => $schedule->id, 'latitude' => 14.5995,
            'longitude' => 120.9842, 'accuracy' => 8,
        ]);
    }

    public function test_absence_is_created_only_after_end_and_only_for_registered_students(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        User::factory()->create(['role' => 'student', 'section' => 'A']);
        foreach (['2026-10-05 09:59:59', '2026-10-05 10:00:00'] as $time) {
            $this->time($time);
            $this->assertSame(0, app(AttendanceAutoService::class)->process());
        }
        $this->time('2026-10-05 10:00:01');
        $this->artisan('attendance:process')->assertSuccessful();
        $this->assertDatabaseCount('attendances', 1);
        $this->assertDatabaseHas('attendances', [
            'student_id' => $student->id, 'schedule_id' => $schedule->id,
            'attendance_date' => '2026-10-05 00:00:00', 'status' => 'Absent',
            'time_in' => null, 'time_out' => null, 'latitude' => null, 'longitude' => null,
        ]);
        $this->assertSame(0, app(AttendanceAutoService::class)->process());
    }

    public function test_check_in_boundaries_grace_and_duplicates(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $this->time('2026-10-05 07:44:59');
        $this->checkIn($student, $schedule)->assertUnprocessable();
        $this->time('2026-10-05 07:55:00');
        $this->checkIn($student, $schedule)->assertOk()->assertJsonPath('status', 'present');
        $this->time('2026-10-05 08:27:00');
        $this->checkIn($student, $schedule)->assertOk()->assertJsonPath('status', 'present');
        $this->assertDatabaseCount('attendances', 1);
        Attendance::query()->delete();
        $this->time('2026-10-05 08:15:00');
        $this->checkIn($student, $schedule)->assertOk()->assertJsonPath('status', 'present');
        Attendance::query()->delete();
        $this->time('2026-10-05 08:15:01');
        $this->checkIn($student, $schedule)->assertOk()->assertJsonPath('status', 'late');
        $this->time('2026-10-05 10:01:00');
        $this->checkIn($student, $schedule)->assertUnprocessable();
        $this->assertSame(0, app(AttendanceAutoService::class)->process());
        $this->assertSame('Late', Attendance::firstOrFail()->status);
    }

    public function test_non_class_days_future_dates_and_registration_date_are_skipped(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $this->time('2026-10-06 10:01:00');
        $this->checkIn($student, $schedule)->assertUnprocessable();
        $this->assertSame(0, app(AttendanceAutoService::class)->process(Schedule::query(), '2026-10-06'));
        $this->assertSame(0, app(AttendanceAutoService::class)->process(Schedule::query(), '2026-10-07'));
        $this->time('2026-10-07 10:01:00');
        $schedule->registeredStudents()->updateExistingPivot($student->id, ['registered_at' => now()]);
        $this->assertSame(0, app(AttendanceAutoService::class)->process());
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_overnight_check_in_and_absence_use_session_start_date(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $schedule->update(['start_time' => '23:00:00', 'end_time' => '01:00:00']);
        $this->time('2026-10-06 00:30:00');
        $this->assertSame(0, app(AttendanceAutoService::class)->process());
        $this->checkIn($student, $schedule)->assertOk()->assertJsonPath('status', 'late');
        $this->assertDatabaseHas('attendances', ['attendance_date' => '2026-10-05 00:00:00', 'status' => 'Late']);
        Attendance::query()->delete();
        $this->time('2026-10-06 01:00:01');
        $this->assertSame(1, app(AttendanceAutoService::class)->process());
        $this->assertDatabaseHas('attendances', ['attendance_date' => '2026-10-05 00:00:00', 'status' => 'Absent']);
    }

    public function test_manual_correction_cannot_erase_gps_record_and_fallback_preserves_it(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $this->time('2026-10-05 08:04:00');
        $this->checkIn($student, $schedule)->assertOk();
        $id = Attendance::firstOrFail()->id;
        $this->actingAs($owner)->post('/attendance', [
            'student_id' => $student->id, 'schedule_id' => $schedule->id,
            'attendance_date' => '2026-10-05', 'status' => 'late',
        ])->assertRedirect()->assertSessionHasErrors('status');
        $this->time('2026-10-05 10:01:00');
        $this->actingAs($owner)->get('/attendance/create')->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('calendar.'.$schedule->id.'.2026-10-06', 'non_class')
                ->where('calendar.'.$schedule->id.'.2026-10-07', 'pending')
                ->where('attendance.0.status', 'present_gps')->where('attendance.0.gps_locked', true));
        $this->assertDatabaseCount('attendances', 1);
        $this->assertDatabaseHas('attendances', ['id' => $id, 'status' => 'Present', 'latitude' => 14.5995, 'longitude' => 120.9842]);
    }

    public function test_configurable_grace_and_unregistered_check_in(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        config(['attendance.grace_minutes' => 5]);
        $this->time('2026-10-05 08:06:00');
        $this->checkIn($student, $schedule)->assertOk()->assertJsonPath('status', 'late');
        $outsider = User::factory()->create(['role' => 'student']);
        $this->checkIn($outsider, $schedule)->assertForbidden();
    }

    public function test_completed_classes_and_inactive_registrations_are_skipped(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $this->time('2026-10-05 10:01:00');
        $schedule->registeredStudents()->updateExistingPivot($student->id, ['status' => 'inactive']);
        $this->assertSame(0, app(AttendanceAutoService::class)->process());
        $schedule->registeredStudents()->updateExistingPivot($student->id, ['status' => 'active']);
        $schedule->update(['status' => 'Completed']);
        $this->assertSame(0, app(AttendanceAutoService::class)->process());
    }

    public function test_future_and_non_class_manual_writes_are_rejected(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $this->time('2026-10-06 10:01:00');
        foreach (['2026-10-06', '2026-10-07'] as $date) {
            $this->actingAs($owner)->post('/attendance', [
                'student_id' => $student->id, 'schedule_id' => $schedule->id,
                'attendance_date' => $date, 'status' => 'present',
            ])->assertSessionHasErrors('attendance_date');
        }
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_student_dashboard_exposes_early_and_overnight_registered_check_in_sessions(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $this->time('2026-10-05 07:55:00');
        $this->actingAs($student)->get('/student/dashboard')->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('currentClass.schedule_id', $schedule->id)
                ->where('currentClass.recording', true));
        $schedule->update(['start_time' => '23:00:00', 'end_time' => '01:00:00']);
        $this->time('2026-10-06 00:20:00');
        $this->checkIn($student, $schedule)->assertOk()->assertJsonPath('status', 'late');
        $this->actingAs($student)->get('/student/dashboard')->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('currentClass.schedule_id', $schedule->id)
                ->where('currentClass.attendance_status', 'late')
                ->where('currentClass.check_in', '00:20'));
    }

    public function test_dashboard_does_not_offer_unregistered_section_class_for_automatic_check_in(): void
    {
        [$owner, $student, $schedule] = $this->fixture();
        $schedule->registeredStudents()->detach($student);
        $this->time('2026-10-05 08:05:00');
        $this->actingAs($student)->get('/student/dashboard')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('currentClass', null));
    }
}
