<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            return redirect('/admin/dashboard');
        }

        if ($user->role === 'instructor') {
            return redirect('/dashboard');
        }

        if ($user->role === 'student') {
            return redirect('/student/dashboard');
        }

        return redirect('/');
    }
}