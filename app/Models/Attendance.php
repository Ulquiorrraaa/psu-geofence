<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $fillable = [
        'student_id',
        'schedule_id',
        'attendance_date',
        'status',
        'time_in',
        'time_out',
        'latitude',
        'longitude',
    ];

    public function setStatusAttribute(string $value): void
    {
        // Preserve the existing database enum while accepting API lowercase values.
        $this->attributes['status'] = ucfirst(strtolower(trim($value)));
    }

    protected function casts(): array
    {
        return [
            'student_id' => 'integer',

            'schedule_id' => 'integer',

            'attendance_date' => 'date',

            'time_in' => 'datetime',

            'time_out' => 'datetime',

            'latitude' => 'decimal:7',

            'longitude' => 'decimal:7',
        ];
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(
            Schedule::class,
            'schedule_id'
        );
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'student_id'
        );
    }
}
