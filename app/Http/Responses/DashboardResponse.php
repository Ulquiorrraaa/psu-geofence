<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse;
use Laravel\Fortify\Contracts\RegisterResponse;

class DashboardResponse implements LoginResponse, RegisterResponse
{
    public function toResponse($request)
    {
        return match (strtolower(trim((string) $request->user()->role))) {
            'admin' => redirect()->route('admin.dashboard'),
            'guard' => redirect()->route('guard.dashboard'),
            'student' => redirect()->route('student.dashboard'),
            default => redirect()->route('dashboard'),
        };
    }
}
