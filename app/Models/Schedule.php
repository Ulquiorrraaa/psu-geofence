<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Schedule extends Model
{
    protected $fillable = [
        'user_id',
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
    ];

    protected function casts(): array
    {
        return [
            'days' => 'array',
            'students' => 'integer',
            'recording' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }
}