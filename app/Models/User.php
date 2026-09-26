<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'year',
        'section',
        'adviser',
        'status',
    ];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

   public function schedules()
{
    return $this->hasMany(Schedule::class, 'user_id');
}

public function attendances()
{
    return $this->hasMany(Attendance::class, 'student_id');
}
}