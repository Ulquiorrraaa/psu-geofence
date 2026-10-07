<?php

namespace Tests\Feature\Instructor;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AttendanceDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_instructor_attendance_page_lists_only_owned_records_with_the_record_id(): void
    {
        $instructor = User::factory()->create(['role' => 'instructor']);
        $otherInstructor = User::factory()->create(['role' => 'instructor']);
        $student = User::factory()->create(['role' => 'student']);

        $ownedAttendance = $this->createAttendance(
            $this->createSchedule($instructor),
            $student,
        );
        $this->createAttendance(
            $this->createSchedule($otherInstructor),
            $student,
        );

        $this->actingAs($instructor)
            ->get(route('attendance'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('instructor/Attendance')
                ->has('instructorAttendanceRecords', 1)
                ->where('instructorAttendanceRecords.0.id', $ownedAttendance->id)
                ->where('instructorAttendanceRecords.0.name', $student->name)
                ->where('instructorAttendanceRecords.0.status', 'Present')
            );
    }

    public function test_instructor_can_delete_their_attendance_record_without_deleting_related_rows(): void
    {
        $instructor = User::factory()->create(['role' => 'instructor']);
        $student = User::factory()->create(['role' => 'student']);
        $schedule = $this->createSchedule($instructor);
        $attendance = $this->createAttendance($schedule, $student);

        $this->actingAs($instructor)
            ->from(route('attendance'))
            ->delete(route('attendance.destroy', $attendance))
            ->assertRedirect(route('attendance'))
            ->assertSessionHas('success', 'Attendance record deleted successfully.');

        $this->assertDatabaseMissing('attendances', ['id' => $attendance->id]);
        $this->assertDatabaseHas('schedules', ['id' => $schedule->id]);
        $this->assertDatabaseHas('users', ['id' => $student->id]);
    }

    public function test_instructor_cannot_delete_another_instructors_attendance_record(): void
    {
        $instructor = User::factory()->create(['role' => 'instructor']);
        $otherInstructor = User::factory()->create(['role' => 'instructor']);
        $student = User::factory()->create(['role' => 'student']);
        $attendance = $this->createAttendance(
            $this->createSchedule($otherInstructor),
            $student,
        );

        $this->actingAs($instructor)
            ->delete(route('attendance.destroy', $attendance))
            ->assertForbidden();

        $this->assertDatabaseHas('attendances', ['id' => $attendance->id]);
    }

    public function test_missing_attendance_record_returns_not_found(): void
    {
        $instructor = User::factory()->create(['role' => 'instructor']);

        $this->actingAs($instructor)
            ->delete(route('attendance.destroy', 999999))
            ->assertNotFound();
    }

    private function createSchedule(User $instructor): Schedule
    {
        return Schedule::create([
            'user_id' => $instructor->id,
            'subject' => 'Biology',
            'instructor' => $instructor->name,
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'students' => 1,
            'location' => 'Room 1',
            'coordinates' => '10.0000000, 20.0000000',
            'radius' => '50',
            'days' => ['Monday'],
            'status' => 'Scheduled',
        ]);
    }

    private function createAttendance(Schedule $schedule, User $student): Attendance
    {
        return Attendance::create([
            'schedule_id' => $schedule->id,
            'student_id' => $student->id,
            'attendance_date' => today()->toDateString(),
            'status' => 'Present',
            'time_in' => now(),
        ]);
    }
}
