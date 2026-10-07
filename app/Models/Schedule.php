<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Schedule extends Model
{
    protected $fillable = [
        'user_id',
        'instructor_id',
        'subject',
        'section',
        'instructor',
        'start_time',
        'end_time',
        'students',
        'location',
        'coordinates',
        'radius',
        'days',
        'status',
        'recording',

        /*
        |--------------------------------------------------------------------------
        | CLASS REGISTRATION
        |--------------------------------------------------------------------------
        */

        'registration_token',
        'registration_enabled',
        'registration_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'instructor_id' => 'integer',
            'days' => 'array',
            'students' => 'integer',
            'recording' => 'boolean',
            'registration_enabled' => 'boolean',
            'registration_expires_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Automatically Create Registration Token
    |--------------------------------------------------------------------------
    |
    | Every NEW class receives its own unique registration token.
    |
    */

    protected static function booted(): void
    {
        static::creating(function (Schedule $schedule): void {
            if (empty($schedule->registration_token)) {
                $schedule->registration_token =
                    static::generateUniqueRegistrationToken();
            }

            if ($schedule->registration_enabled === null) {
                $schedule->registration_enabled = true;
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Instructor / Owner
    |--------------------------------------------------------------------------
    */

    public function user(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Registered Students
    |--------------------------------------------------------------------------
    */

    public function registeredStudents(): BelongsToMany
    {
        return $this
            ->belongsToMany(
                User::class,
                'schedule_student',
                'schedule_id',
                'student_id'
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
            'schedule_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Ensure Registration Link
    |--------------------------------------------------------------------------
    |
    | Old classes that do not have a registration token will automatically
    | receive one.
    |
    */

    public function ensureRegistrationLink(): self
    {
        $changes = [];

        if (empty($this->registration_token)) {
            $changes['registration_token'] =
                static::generateUniqueRegistrationToken();

            $changes['registration_enabled'] = true;
        }

        if (! empty($changes)) {
            $this->forceFill(
                $changes
            )->save();

            $this->refresh();
        }

        return $this;
    }

    /*
    |--------------------------------------------------------------------------
    | Regenerate Registration Link
    |--------------------------------------------------------------------------
    |
    | This changes ONLY this class registration token.
    |
    */

    public function regenerateRegistrationLink(): self
    {
        $this->forceFill([
            'registration_token' => static::generateUniqueRegistrationToken(),

            'registration_enabled' => true,
        ])->save();

        $this->refresh();

        return $this;
    }

    /*
    |--------------------------------------------------------------------------
    | Registration Availability
    |--------------------------------------------------------------------------
    */

    public function registrationIsAvailable(): bool
    {
        if (empty($this->registration_token)) {
            return false;
        }

        if (! $this->registration_enabled) {
            return false;
        }

        if (
            $this->registration_expires_at !== null &&
            $this->registration_expires_at->isPast()
        ) {
            return false;
        }

        return true;
    }

    /*
    |--------------------------------------------------------------------------
    | Generate Unique 64 Character Token
    |--------------------------------------------------------------------------
    */

    private static function generateUniqueRegistrationToken(): string
    {
        do {
            $token = Str::random(64);
        } while (
            static::query()
                ->where(
                    'registration_token',
                    $token
                )
                ->exists()
        );

        return $token;
    }
}
