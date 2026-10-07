<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    /** @use HasFactory<UserFactory> */
    use HasFactory;

    use Notifiable;
    use TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'student_id',
        'course',
        'year',
        'section',
        'adviser',
        'adviser_id',
        'status',
        'profile_picture', 'phone', 'employee_id', 'department', 'assigned_area',
    ];

    protected $appends = ['profile_picture_url'];

    public function getProfilePictureUrlAttribute(): ?string
    {
        return $this->profile_picture ? Storage::disk('public')->url($this->profile_picture) : null;
    }

    protected $hidden = [
        'password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Role
    |--------------------------------------------------------------------------
    */

    public function getRoleAttribute(
        ?string $value
    ): ?string {
        if ($value === null) {
            return null;
        }

        return strtolower(
            trim($value)
        );
    }

    public function setRoleAttribute(
        string $value
    ): void {
        $this->attributes['role'] =
            strtolower(
                trim($value)
            );
    }

    /*
    |--------------------------------------------------------------------------
    | Instructor Schedules
    |--------------------------------------------------------------------------
    */

    public function schedules(): HasMany
    {
        return $this->hasMany(
            Schedule::class,
            'user_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | REGISTER FOR CLASS
    |--------------------------------------------------------------------------
    |
    | This relationship is ONLY for classes that the student joined.
    |
    | Table:
    | schedule_student
    |
    */

    public function registeredSchedules(): BelongsToMany
    {
        return $this
            ->belongsToMany(
                Schedule::class,
                'schedule_student',
                'student_id',
                'schedule_id'
            )
            ->withPivot([
                'student_number',
                'year_level',
                'section',
                'status',

                'registered_at',
            ])
            ->withTimestamps();
    }

    /*
    |--------------------------------------------------------------------------
    | Attendance
    |--------------------------------------------------------------------------
    */

    public function attendances(): HasMany
    {
        return $this->hasMany(
            Attendance::class,
            'student_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | STUDENT REGISTRATION
    |--------------------------------------------------------------------------
    |
    | These relationships are completely separate from Register for Class.
    |
    */

    public function studentRegistrationLinks(): HasMany
    {
        return $this->hasMany(
            StudentRegistrationLink::class,
            'instructor_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Students Registered Under Instructor
    |--------------------------------------------------------------------------
    */

    public function instructorStudentRegistrations(): HasMany
    {
        return $this->hasMany(
            StudentRegistration::class,
            'instructor_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Student Registration Records
    |--------------------------------------------------------------------------
    */

    public function studentRegistrations(): HasMany
    {
        return $this->hasMany(
            StudentRegistration::class,
            'student_id'
        );
    }
}
