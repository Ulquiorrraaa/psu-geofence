<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn(
            'schedules',
            'registration_token'
        )) {
            Schema::table('schedules', function (Blueprint $table) {
                $table->uuid('registration_token')
                    ->nullable()
                    ->unique()
                    ->after('id');
            });
        }

        DB::table('schedules')
            ->whereNull('registration_token')
            ->orderBy('id')
            ->each(function ($schedule) {
                DB::table('schedules')
                    ->where('id', $schedule->id)
                    ->update([
                        'registration_token' => (string) Str::uuid(),
                    ]);
            });
    }

    public function down(): void
    {
        if (Schema::hasColumn(
            'schedules',
            'registration_token'
        )) {
            Schema::table('schedules', function (Blueprint $table) {
                $table->dropColumn('registration_token');
            });
        }
    }
};
