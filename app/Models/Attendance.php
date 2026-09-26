<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $fillable = [
        'student_id',
        'schedule_id',
        'status',
        'time_in',
        'latitude',
        'longitude',
    ];

    protected function casts(): array
    {
        return [
            'student_id' => 'integer',
            'schedule_id' => 'integer',
            'time_in' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}