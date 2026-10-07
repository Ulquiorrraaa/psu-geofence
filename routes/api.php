<?php

use App\Http\Controllers\Api\StudentAttendanceController;
use App\Http\Controllers\Api\StudentAuthController;
use App\Http\Controllers\Api\StudentDashboardController;
use App\Http\Controllers\Api\StudentScheduleController;
use Illuminate\Support\Facades\Route;

Route::post('/student/login', [StudentAuthController::class, 'login'])->middleware('throttle:login');

Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::middleware(['student'])->group(function () {
        Route::get('/student/profile', [StudentAuthController::class, 'profile']);
        Route::post('/student/logout', [StudentAuthController::class, 'logout']);
        Route::get('/student/dashboard', [StudentDashboardController::class, 'index']);
        Route::get('/student/schedules', [StudentScheduleController::class, 'index']);
        Route::get('/student/attendance-history', [StudentAttendanceController::class, 'history']);
        Route::post('/student/attendance', [StudentAttendanceController::class, 'store']);
    });
});
