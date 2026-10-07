<?php

namespace Tests\Feature\Student;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Date;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GpsTrackingTest extends TestCase
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

    private function registeredClass(): array
    {
        $student = User::factory()->create(['role' => 'student']);
        $owner = User::factory()->create(['role' => 'instructor']);
        $schedule = Schedule::create([
            'user_id' => $owner->id, 'subject' => 'GPS Test', 'instructor' => $owner->name,
            'start_time' => '09:00:00', 'end_time' => '10:00:00', 'students' => 25,
            'location' => 'Room 1', 'coordinates' => '14.5995000, 120.9842000',
            'radius' => '50', 'days' => ['Tuesday'], 'status' => 'Scheduled', 'recording' => true,
        ]);
        $schedule->registeredStudents()->attach($student);

        return [$student, $schedule];
    }

    public function test_dashboard_never_returns_attendance_coordinates_as_current_location(): void
    {
        [$student, $schedule] = $this->registeredClass();
        Attendance::create([
            'student_id' => $student->id, 'schedule_id' => $schedule->id,
            'attendance_date' => '2026-10-06', 'status' => 'present', 'time_in' => now(),
            'latitude' => 1.1234567, 'longitude' => 2.1234567,
        ]);
        $this->actingAs($student)->get('/student/dashboard')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('student/Dashboard')
                ->where('location.latitude', null)->where('location.longitude', null));
        Sanctum::actingAs($student);
        $this->getJson('/api/student/dashboard')->assertOk()
            ->assertJsonPath('gps_tracking.latitude', null)
            ->assertJsonPath('gps_tracking.longitude', null)
            ->assertJsonPath('gps_tracking.status', 'Awaiting browser location');
    }

    public function test_check_in_stores_student_coordinates_without_replacing_them_with_class_center(): void
    {
        [$student, $schedule] = $this->registeredClass();
        $this->actingAs($student)->postJson('/student/attendance/check-in', [
            'schedule_id' => $schedule->id, 'latitude' => 14.5995347,
            'longitude' => 120.9842478, 'accuracy' => 8,
        ])->assertOk()->assertJsonPath('inside_geofence', true);
        $attendance = Attendance::firstOrFail();
        $this->assertSame('14.5995347', $attendance->latitude);
        $this->assertSame('120.9842478', $attendance->longitude);
    }

    public function test_haversine_rejects_a_student_outside_the_class_radius(): void
    {
        [$student, $schedule] = $this->registeredClass();
        $response = $this->actingAs($student)->postJson('/student/attendance/check-in', [
            'schedule_id' => $schedule->id, 'latitude' => 14.6005,
            'longitude' => 120.9842, 'accuracy' => 8,
        ])->assertStatus(422)->assertJsonPath('inside_geofence', false);
        $this->assertEqualsWithDelta(111.19, $response->json('distance'), 0.1);
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_poor_reported_accuracy_is_rejected_without_recording_attendance(): void
    {
        [$student, $schedule] = $this->registeredClass();
        $this->actingAs($student)->postJson('/student/attendance/check-in', [
            'schedule_id' => $schedule->id, 'latitude' => 14.5995,
            'longitude' => 120.9842, 'accuracy' => 51,
        ])->assertUnprocessable()->assertJsonValidationErrors('accuracy');
        $this->assertDatabaseCount('attendances', 0);
    }
}
