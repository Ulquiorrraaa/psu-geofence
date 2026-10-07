<?php

namespace Tests\Feature\Student;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\StudentNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentNotificationTest extends TestCase
{
    use RefreshDatabase;

    private function notice(User $user): StudentNotification
    {
        return StudentNotification::create([
            'user_id' => $user->id, 'event_key' => uniqid('test-'),
            'title' => 'Attendance recorded', 'message' => 'Mathematics · Present',
            'href' => '/student/attendance',
        ]);
    }

    public function test_read_state_persists_and_is_private_to_each_student(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $other = User::factory()->create(['role' => 'student']);
        $mine = $this->notice($student);
        $theirs = $this->notice($other);
        $this->actingAs($student)->getJson('/student/notifications')
            ->assertOk()->assertJsonPath('unread_count', 1)->assertJsonCount(1, 'notifications');
        $this->patchJson('/student/notifications/'.$theirs->id.'/read')->assertNotFound();
        $this->patchJson('/student/notifications/'.$mine->id.'/read')->assertOk();
        $this->getJson('/student/notifications')->assertJsonPath('unread_count', 0);
        $this->assertNotNull($mine->refresh()->read_at);
        $this->assertNull($theirs->refresh()->read_at);
        $readAt = $mine->read_at->toIso8601String();
        $this->travel(2)->minutes();
        $this->patchJson('/student/notifications/'.$mine->id.'/read')->assertOk();
        $this->assertSame($readAt, $mine->refresh()->read_at->toIso8601String());
    }

    public function test_mark_all_reads_history_beyond_the_visible_limit_and_preserves_new_arrivals(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $other = User::factory()->create(['role' => 'student']);
        for ($i = 0; $i < 55; $i++) {
            $last = $this->notice($student);
        }
        $new = $this->notice($student);
        $theirs = $this->notice($other);
        $this->actingAs($student)->getJson('/student/notifications')
            ->assertJsonCount(50, 'notifications')->assertJsonPath('unread_count', 56);
        $this->patchJson('/student/notifications/read-all', ['before_id' => $theirs->id])->assertNotFound();
        $this->patchJson('/student/notifications/read-all', ['before_id' => $last->id])->assertOk();
        $this->getJson('/student/notifications')->assertJsonPath('unread_count', 1);
        $this->assertNull($new->refresh()->read_at);
        $this->assertNull($theirs->refresh()->read_at);
    }

    public function test_attendance_updates_generate_new_notices_without_repeating_read_notices(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $instructor = User::factory()->create(['role' => 'instructor']);
        $schedule = Schedule::create([
            'user_id' => $instructor->id, 'instructor' => $instructor->name,
            'subject' => 'Mathematics', 'start_time' => '09:00:00', 'end_time' => '10:00:00',
            'days' => [], 'students' => 20, 'location' => 'Room 1',
            'coordinates' => '1.0000000, 2.0000000', 'radius' => '50', 'status' => 'Scheduled',
        ]);
        $record = Attendance::create(['schedule_id' => $schedule->id, 'student_id' => $student->id, 'attendance_date' => now()->toDateString(), 'status' => 'Present']);
        $this->actingAs($student)->getJson('/student/notifications')->assertJsonPath('unread_count', 1);
        $notice = StudentNotification::where('user_id', $student->id)->firstOrFail();
        $this->patchJson('/student/notifications/'.$notice->id.'/read')->assertOk();
        $this->getJson('/student/notifications')->assertJsonPath('unread_count', 0);
        $record->update(['status' => 'Late']);
        $this->getJson('/student/notifications')->assertJsonPath('unread_count', 1)->assertJsonCount(2, 'notifications');
    }

    public function test_upcoming_registered_class_expires_after_start_and_other_sections_are_excluded(): void
    {
        $this->travelTo(now()->startOfDay()->setHour(8));
        $student = User::factory()->create(['role' => 'student', 'section' => 'A']);
        $instructor = User::factory()->create(['role' => 'instructor']);
        $attributes = [
            'user_id' => $instructor->id, 'instructor' => $instructor->name,
            'subject' => 'Registered class', 'section' => 'B',
            'start_time' => '09:00:00', 'end_time' => '10:00:00',
            'days' => [now()->format('l')], 'students' => 20, 'location' => 'Room 1',
            'coordinates' => '1.0000000, 2.0000000', 'radius' => '50', 'status' => 'Scheduled',
        ];
        $schedule = Schedule::create($attributes);
        $student->registeredSchedules()->attach($schedule->id);
        Schedule::create([...$attributes, 'subject' => 'Unrelated class']);
        $this->actingAs($student)->getJson('/student/notifications')
            ->assertJsonPath('unread_count', 1)->assertJsonCount(1, 'notifications');
        $this->travel(2)->hours();
        $this->getJson('/student/notifications')->assertJsonPath('unread_count', 0)->assertJsonCount(0, 'notifications');
    }

    public function test_only_authenticated_students_can_access_notification_actions(): void
    {
        $this->getJson('/student/notifications')->assertUnauthorized();
        $instructor = User::factory()->create(['role' => 'instructor']);
        $this->actingAs($instructor)->getJson('/student/notifications')->assertForbidden();
        $this->patchJson('/student/notifications/read-all', ['before_id' => 1])->assertForbidden();
    }
}
