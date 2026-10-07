<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentRegistration extends Model
{
    protected $fillable = [
        'full_name', 'email', 'course', 'adviser_name',
        'registration_link_id',
        'instructor_id',
        'student_id',
        'student_number',
        'year_level',
        'section',
        'status',
        'registered_at',
    ];

    protected function casts(): array
    {
        return [
            'registration_link_id' => 'integer',

            'instructor_id' => 'integer',

            'student_id' => 'integer',

            'registered_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Registration Link
    |--------------------------------------------------------------------------
    */

    public function registrationLink(): BelongsTo
    {
        return $this->belongsTo(
            StudentRegistrationLink::class,
            'registration_link_id'
        );
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
    | Student
    |--------------------------------------------------------------------------
    */

    public function student(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'student_id'
        );
    }
}
