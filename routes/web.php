<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminReportController;
use App\Http\Controllers\Admin\AdminScheduleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\InstructorDashboardController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\StudentPortalController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

/*
|--------------------------------------------------------------------------
| Instructor routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'instructor'])->group(function () {
    /*
    |--------------------------------------------------------------------------
    | Instructor dashboard
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/dashboard',
        [InstructorDashboardController::class, 'index']
    )->name('dashboard');

    Route::get(
        '/classes/{schedule}',
        [InstructorDashboardController::class, 'show']
    )->name('classes.show');

    /*
    |--------------------------------------------------------------------------
    | Attendance
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/attendance',
        [AttendanceController::class, 'index']
    )->name('attendance');

    Route::get(
        '/attendance/create',
        [AttendanceController::class, 'create']
    )->name('attendance.create');

    Route::post(
        '/attendance',
        [AttendanceController::class, 'store']
    )->name('attendance.store');

    Route::get(
        '/attendance/{attendance}',
        [AttendanceController::class, 'show']
    )->name('attendance.show');

    /*
    |--------------------------------------------------------------------------
    | Schedules
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/schedules',
        [ScheduleController::class, 'index']
    )->name('schedules');

    Route::post(
        '/schedules',
        [ScheduleController::class, 'store']
    )->name('schedules.store');

    Route::put(
        '/schedules/{schedule}',
        [ScheduleController::class, 'update']
    )->name('schedules.update');

    Route::patch(
        '/schedules/{schedule}/recording',
        [ScheduleController::class, 'updateRecording']
    )->name('schedules.recording');

    Route::delete(
        '/schedules/{schedule}',
        [ScheduleController::class, 'destroy']
    )->name('schedules.destroy');
});

/*
|--------------------------------------------------------------------------
| Admin routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get(
            '/dashboard',
            [AdminDashboardController::class, 'index']
        )->name('dashboard');

        Route::inertia(
            '/attendance',
            'admin/Attendance'
        )->name('attendance');

        Route::get(
            '/schedules',
            [AdminScheduleController::class, 'index']
        )->name('schedules');

        Route::post(
            '/schedules',
            [AdminScheduleController::class, 'store']
        )->name('schedules.store');

        Route::get(
            '/reports',
            [AdminReportController::class, 'index']
        )->name('reports');

        Route::get(
            '/users',
            [UserController::class, 'index']
        )->name('users');

        Route::post(
            '/users',
            [UserController::class, 'store']
        )->name('users');

        /*
        |--------------------------------------------------------------------------
        | Assign adviser
        |--------------------------------------------------------------------------
        */

        Route::put('/users/assign-adviser', function (Request $request) {
            $validated = $request->validate([
                'year' => ['required', 'string'],
                'section' => ['required', 'string'],
                'adviser' => ['required', 'string'],
            ]);

            User::query()
                ->where('role', 'student')
                ->where('year', $validated['year'])
                ->where('section', $validated['section'])
                ->update([
                    'adviser' => $validated['adviser'],
                ]);

            return back()->with(
                'success',
                'The adviser was assigned successfully.'
            );
        })->name('users.assign-adviser');

        Route::delete(
            '/users/{user}',
            [UserController::class, 'destroy']
        )->name('users.destroy');
    });

/*
|--------------------------------------------------------------------------
| Student Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'student'])
    ->prefix('student')
    ->name('student.')
    ->group(function () {
        Route::inertia('/dashboard', 'student/Dashboard')->name('dashboard');
        Route::get('/schedules', [StudentPortalController::class, 'schedules'])->name('schedules');
        Route::get('/attendance', [StudentPortalController::class, 'attendance'])->name('attendance');
        Route::get('/profile', [StudentPortalController::class, 'profile'])->name('profile');
    });

/*
|--------------------------------------------------------------------------
| Settings routes
|--------------------------------------------------------------------------
*/

require __DIR__.'/settings.php';
