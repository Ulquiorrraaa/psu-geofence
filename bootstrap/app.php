<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\EnsureActiveAccount;
use App\Http\Middleware\GuardMiddleware;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\InstructorMiddleware;
use App\Http\Middleware\StudentMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {

        /*
        |--------------------------------------------------------------------------
        | Custom Middleware Aliases
        |--------------------------------------------------------------------------
        */

        $middleware->alias([
            'admin' => AdminMiddleware::class,
            'guard' => GuardMiddleware::class,
            'instructor' => InstructorMiddleware::class,
            'student' => StudentMiddleware::class,
        ]);

        $middleware->web(append: [
            EnsureActiveAccount::class,
            HandleInertiaRequests::class,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Redirect Guests
        |--------------------------------------------------------------------------
        */

        $middleware->redirectGuestsTo(
            fn (Request $request) => route('login')
        );

        /*
        |--------------------------------------------------------------------------
        | Redirect Already Logged-In Users
        |--------------------------------------------------------------------------
        |
        | This fixes the 403 when an authenticated student/admin/instructor
        | tries to visit /login or /register.
        |
        */

        $middleware->redirectUsersTo(function (Request $request) {

            $user = $request->user();

            if (! $user) {
                return route('home');
            }

            return match (strtolower(trim((string) $user->role))) {
                'admin' => route('admin.dashboard'),
                'guard' => route('guard.dashboard'),
                'instructor' => route('dashboard'),
                'student' => route('student.dashboard'),
                default => route('home'),
            };
        });

    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->create();
