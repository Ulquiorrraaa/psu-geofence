<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentRegistrationLink extends Model
{
    protected $fillable = [
        'instructor_id',
        'token',
        'is_active',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'instructor_id' => 'integer',
            'is_active' => 'boolean',
            'expires_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Instructor
    |--------------------------------------------------------------------------
    */

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'instructor_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Student Information Registrations
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | This is NOT class registration.
    |
    */

    public function registrations(): HasMany
    {
        return $this->hasMany(
            StudentRegistration::class,
            'registration_link_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Is Student Registration Link Available?
    |--------------------------------------------------------------------------
    */

    public function isAvailable(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if (
            $this->expires_at !== null &&
            $this->expires_at->isPast()
        ) {
            return false;
        }

        return true;
    }
}
