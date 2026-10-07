<?php

namespace Tests\Feature\Guard;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentDetailsTest extends TestCase
{
    use RefreshDatabase;

    private function schedule(User $owner, array $overrides = []): Schedule
    {
        return Schedule::create(array_merge([
            'user_id' => $owner->id, 'instructor' => $owner->name, 'subject' => 'Mathematics',
            'start_time' => '09:00:00', 'end_time' => '10:00:00', 'days' => ['Wednesday'],
            'students' => 20, 'location' => 'Room 1', 'coordinates' => '14.5995, 120.9842',
            'radius' => 50, 'status' => 'Scheduled',
        ], $overrides));
    }

    public function test_guard_sees_all_registered_classes_and_only_selected_student_history(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 7)->setTime(9, 30));
        $guard = User::factory()->create(['role' => 'guard']);
        $student = User::factory()->create(['role' => 'student']);
        $other = User::factory()->create(['role' => 'student']);
        $owner = User::factory()->create(['role' => 'instructor']);
        $ongoing = $this->schedule($owner);
        $pending = $this->schedule($owner, ['subject' => 'Science', 'start_time' => '11:00:00', 'end_time' => '12:00:00']);
        $completed = $this->schedule($owner, ['subject' => 'History', 'status' => 'Completed', 'start_time' => '13:00:00', 'end_time' => '14:00:00']);
        $unrelated = $this->schedule($owner, ['subject' => 'Other student only']);
        $student->registeredSchedules()->attach([$ongoing->id, $pending->id, $completed->id]);
        $other->registeredSchedules()->attach($unrelated->id);
        Attendance::create(['student_id' => $other->id, 'schedule_id' => $unrelated->id, 'attendance_date' => '2026-10-07', 'status' => 'Absent']);
        for ($i = 1; $i <= 25; $i++) {
            Attendance::create(['student_id' => $student->id, 'schedule_id' => $ongoing->id, 'attendance_date' => now()->subDays($i)->toDateString(), 'status' => 'Present']);
        }
        $this->actingAs($guard)->get('/guard/student-tracking/'.$student->id)
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('guard/StudentDetails')->where('student.id', $student->id)
            ->missing('student.password')->missing('student.email')
            ->has('schedules', 3)->where('schedules.0.state', 'Ongoing')
            ->where('schedules.1.state', 'Pending')->where('schedules.1.next_session.start', '2026-10-07T11:00:00+08:00')
            ->where('schedules.2.state', 'Completed')->where('schedules.2.next_session', null)
            ->where('records.total', 25)->has('records.data', 20)
            ->where('records.data.0.subject', 'Mathematics'));
        $this->get('/guard/student-tracking/'.$student->id.'?page=2')
            ->assertInertia(fn (Assert $page) => $page->where('records.current_page', 2)->has('records.data', 5));
    }

    public function test_overnight_class_is_ongoing_after_midnight_and_inactive_enrollment_is_not_pending(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 7)->setTime(0, 30));
        $guard = User::factory()->create(['role' => 'guard']);
        $student = User::factory()->create(['role' => 'student']);
        $owner = User::factory()->create(['role' => 'instructor']);
        $overnight = $this->schedule($owner, ['days' => ['Tuesday'], 'start_time' => '23:00:00', 'end_time' => '01:00:00']);
        $inactive = $this->schedule($owner);
        $student->registeredSchedules()->attach($overnight->id);
        $student->registeredSchedules()->attach($inactive->id, ['status' => 'inactive']);
        $this->actingAs($guard)->get('/guard/student-tracking/'.$student->id)
            ->assertInertia(fn (Assert $page) => $page
                ->where('schedules.0.state', 'Inactive enrollment')->where('schedules.0.next_session', null)
                ->where('schedules.1.state', 'Ongoing')->where('schedules.1.next_session.start', '2026-10-06T23:00:00+08:00'));
    }

    public function test_detail_access_requires_guard_and_a_student_target(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $guard = User::factory()->create(['role' => 'guard']);
        $this->get('/guard/student-tracking/'.$student->id)->assertRedirect('/login');
        foreach (['student', 'instructor', 'admin'] as $role) {
            $user = User::factory()->create(['role' => $role]);
            $this->actingAs($user)->getJson('/guard/student-tracking/'.$student->id)->assertForbidden();
        }
        $this->actingAs($guard)->get('/guard/student-tracking/'.$guard->id)->assertNotFound();
        $this->get('/guard/student-tracking/'.$student->id)->assertInertia(fn (Assert $page) => $page->has('schedules', 0)->where('records.total', 0));
    }
}
