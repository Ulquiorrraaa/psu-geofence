<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StudentMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        abort_if($user->status === 'Inactive', 403, 'This account is inactive.');
        if ($request->expectsJson()) {
            abort_unless($user->role === 'student', 403);
        }
        $role = strtolower(trim((string) $user->role));

        if ($role !== 'student') {

            return match ($role) {
                'admin' => redirect()->route('admin.dashboard'),
                'guard' => redirect()->route('guard.dashboard'),
                'instructor' => redirect()->route('dashboard'),
                default => redirect()->route('home'),
            };
        }

        return $next($request);
    }
}
