<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class StudentNotification extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['read_at' => 'datetime', 'expires_at' => 'datetime'];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where(fn (Builder $query) => $query
            ->whereNull('expires_at')->orWhere('expires_at', '>', now()));
    }
}
