<?php

use App\Services\AttendanceAutoService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('attendance:process', function () {
    $count = app(AttendanceAutoService::class)->process();
    $this->info("Created {$count} automatic absence records.");
})->purpose('Record missing attendance for finished class sessions');

Schedule::command('attendance:process')
    ->everyMinute()
    ->withoutOverlapping();
