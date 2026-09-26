<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if ($user->role !== 'admin') {

            return match ($user->role) {
                'instructor' => redirect()->route('dashboard'),
                'student' => redirect()->route('student.dashboard'),
                default => redirect()->route('home'),
            };
        }

        return $next($request);
    }
}