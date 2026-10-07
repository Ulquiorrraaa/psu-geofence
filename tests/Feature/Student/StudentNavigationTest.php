<?php

namespace Tests\Feature\Student;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentNavigationTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_navigation_destinations_render_student_pages(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
            'student_id' => 'STU-1001',
            'course' => 'BSIT',
            'year' => '1st Year',
            'section' => 'A',
        ]);

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
                ->where('student.student_id', $student->student_id)
                ->where('student.course', $student->course)
            );

        $this->get(route('student.profile.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('student/Profile/Edit')
                ->where('student.name', $student->name)
                ->where('student.email', $student->email)
            );
    }

    public function test_student_dashboard_uses_attendance_and_only_relevant_schedules(): void
    {
        Carbon::setTestNow('2026-10-03 09:00:00');

        try {
            $student = User::factory()->create([
                'role' => 'student',
                'section' => 'A',
            ]);
            $instructor = User::factory()->create(['role' => 'instructor']);

            $scheduleAttributes = [
                'user_id' => $instructor->id,
                'instructor' => $instructor->name,
                'start_time' => '10:00:00',
                'end_time' => '11:00:00',
                'students' => 25,
                'location' => 'Room 1',
                'coordinates' => '1.0000000, 2.0000000',
                'radius' => '50',
                'days' => [Carbon::now()->format('l')],
                'status' => 'Scheduled',
            ];

            $sectionSchedule = Schedule::create([
                ...$scheduleAttributes,
                'subject' => 'Section A Class',
                'section' => 'A',
            ]);

            $unassignedSchedule = Schedule::create([
                ...$scheduleAttributes,
                'subject' => 'General Class',
                'section' => null,
            ]);

            Schedule::create([
                ...$scheduleAttributes,
                'subject' => 'Section B Class',
                'section' => 'B',
            ]);

            Attendance::create([
                'student_id' => $student->id,
                'schedule_id' => $sectionSchedule->id,
                'attendance_date' => Carbon::today()->toDateString(),
                'status' => 'Present',
                'time_in' => Carbon::now(),
            ]);

            $this->assertSame(
                1,
                Attendance::query()
                    ->where('student_id', $student->id)
                    ->whereDate('attendance_date', '>=', Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString())
                    ->whereDate('attendance_date', '<=', Carbon::today()->toDateString())
                    ->count()
            );

            $this->actingAs($student)
                ->get(route('student.dashboard'))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component('student/Dashboard')
                    ->where('attendanceStats.week_total', 1)
                    ->where('attendanceStats.week_present', 1)
                    ->where('attendanceStats.month_present', 1)
                    ->where('attendanceStats.overall_percentage', 100)
                    ->where('attendanceStats.classes_today', 2)
                    ->has('studentNotifications', 3)
                    ->where('studentNotifications.0.title', 'Attendance recorded')
                    ->where('studentNotifications.1.title', 'Upcoming class')
                    ->where('studentNotifications.2.title', 'Upcoming class')
                );

            $this->get(route('student.schedules'))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component('student/Schedules')
                    ->has('schedules', 2)
                    ->where('schedules.0.id', $unassignedSchedule->id)
                    ->where('schedules.1.id', $sectionSchedule->id)
                );
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_student_can_update_name_and_email_from_student_profile_edit(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $this->actingAs($student)
            ->patch(route('student.profile.update'), [
                'name' => 'Updated Student',
                'email' => 'updated-student@example.com',
                'student_id' => '2026-123',
                'course' => 'BSIT',
                'year' => '3rd Year',
                'section' => 'B',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('student.profile'));

        $this->assertSame('Updated Student', $student->refresh()->name);
        $this->assertSame('updated-student@example.com', $student->email);
    }
}
