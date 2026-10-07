<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\StudentRegistration;
use App\Models\StudentRegistrationLink;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class PortalActivityObserver
{
    public function created(Model $model): void
    {
        $this->record($model, match (true) {
            $model instanceof User => 'User account created',
            $model instanceof Schedule => 'Class created',
            $model instanceof StudentRegistration => 'Student registered',
            $model instanceof StudentRegistrationLink => 'Registration link created',
            default => 'Attendance recorded',
        });
    }

    public function updated(Model $model): void
    {
        if ($model instanceof User) {
            if (! $model->wasChanged(['name', 'email', 'profile_picture', 'phone', 'employee_id', 'department', 'assigned_area', 'course', 'year', 'section', 'student_id', 'adviser', 'status', 'role', 'password'])) {
                return;
            }
            $action = $model->wasChanged('status') ? ($model->status === 'Inactive' ? 'User deactivated' : 'User activated')
                : ($model->wasChanged('password') ? 'Password updated' : 'Profile updated');
        } elseif ($model instanceof Schedule) {
            $action = $model->wasChanged('registration_token') ? 'Class registration link regenerated' : 'Schedule updated';
        } elseif ($model instanceof StudentRegistrationLink) {
            $action = $model->wasChanged('token') ? 'Registration link regenerated' : 'Registration link updated';
        } else {
            $action = $model instanceof Attendance ? 'Attendance updated' : 'Student registration updated';
        }
        $this->record($model, $action);
    }

    public function deleted(Model $model): void
    {
        $this->record($model, class_basename($model).' deleted');
    }

    private function record(Model $model, string $action): void
    {
        if (! Schema::hasTable('activity_logs')) {
            return; // Existing installations remain usable until the additive migration runs.
        }
        $actor = auth()->user();
        ActivityLog::create([
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name ?? 'System',
            'role' => $actor?->role ?? 'system',
            'action' => $action,
            'subject_type' => class_basename($model),
            'subject_id' => $model->getKey(),
        ]);
    }
}
