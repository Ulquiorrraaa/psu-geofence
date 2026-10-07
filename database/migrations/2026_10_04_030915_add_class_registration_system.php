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
        if (! Schema::hasColumn('schedules', 'registration_token')) {
            Schema::table('schedules', function (Blueprint $table) {
                $table->uuid('registration_token')
                    ->nullable()
                    ->after('id');
            });
        }

        if (! Schema::hasIndex(
            'schedules',
            ['registration_token'],
            'unique'
        )) {
            Schema::table('schedules', function (Blueprint $table) {
                $table->unique('registration_token');
            });
        }

        DB::table('schedules')
            ->whereNull('registration_token')
            ->orderBy('id')
            ->chunkById(100, function ($schedules): void {
                foreach ($schedules as $schedule) {
                    DB::table('schedules')
                        ->where('id', $schedule->id)
                        ->whereNull('registration_token')
                        ->update([
                            'registration_token' => (string) Str::uuid(),
                        ]);
                }
            });

        if (! Schema::hasTable('schedule_student')) {
            Schema::create('schedule_student', function (Blueprint $table) {
                $table->id();

                $table->foreignId('schedule_id')
                    ->constrained('schedules')
                    ->cascadeOnDelete();

                $table->foreignId('student_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                $table->timestamp('registered_at')->nullable();

                $table->timestamps();

                $table->unique([
                    'schedule_id',
                    'student_id',
                ]);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_student');

        if (Schema::hasColumn('schedules', 'registration_token')) {
            if (Schema::hasIndex(
                'schedules',
                'schedules_registration_token_unique',
                'unique'
            )) {
                Schema::table('schedules', function (Blueprint $table) {
                    $table->dropUnique('schedules_registration_token_unique');
                });
            }

            Schema::table('schedules', function (Blueprint $table) {
                $table->dropColumn('registration_token');
            });
        }
    }
};
