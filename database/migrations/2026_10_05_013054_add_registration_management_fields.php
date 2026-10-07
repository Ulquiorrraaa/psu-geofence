<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Registration link controls
        |--------------------------------------------------------------------------
        */

        Schema::table('schedules', function (Blueprint $table) {
            if (! Schema::hasColumn('schedules', 'registration_enabled')) {
                $table->boolean('registration_enabled')
                    ->default(false)
                    ->after('registration_token');
            }

            if (! Schema::hasColumn('schedules', 'registration_expires_at')) {
                $table->timestamp('registration_expires_at')
                    ->nullable()
                    ->after('registration_enabled');
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Preserve your existing links
        |--------------------------------------------------------------------------
        |
        | Your old system automatically generated registration_token.
        | We enable existing tokens so the feature you already had does not break.
        |
        */

        DB::table('schedules')
            ->whereNotNull('registration_token')
            ->update([
                'registration_enabled' => true,
            ]);

        /*
        |--------------------------------------------------------------------------
        | Registration information stored in schedule_student
        |--------------------------------------------------------------------------
        */

        Schema::table('schedule_student', function (Blueprint $table) {
            if (! Schema::hasColumn('schedule_student', 'student_number')) {
                $table->string('student_number')
                    ->nullable()
                    ->after('student_id');
            }

            if (! Schema::hasColumn('schedule_student', 'year_level')) {
                $table->string('year_level')
                    ->nullable()
                    ->after('student_number');
            }

            if (! Schema::hasColumn('schedule_student', 'section')) {
                $table->string('section')
                    ->nullable()
                    ->after('year_level');
            }

            if (! Schema::hasColumn('schedule_student', 'status')) {
                $table->string('status')
                    ->default('active')
                    ->after('section');
            }
        });
    }

    public function down(): void
    {
        Schema::table('schedule_student', function (Blueprint $table) {
            if (Schema::hasColumn('schedule_student', 'status')) {
                $table->dropColumn('status');
            }

            if (Schema::hasColumn('schedule_student', 'section')) {
                $table->dropColumn('section');
            }

            if (Schema::hasColumn('schedule_student', 'year_level')) {
                $table->dropColumn('year_level');
            }

            if (Schema::hasColumn('schedule_student', 'student_number')) {
                $table->dropColumn('student_number');
            }
        });

        Schema::table('schedules', function (Blueprint $table) {
            if (Schema::hasColumn('schedules', 'registration_expires_at')) {
                $table->dropColumn('registration_expires_at');
            }

            if (Schema::hasColumn('schedules', 'registration_enabled')) {
                $table->dropColumn('registration_enabled');
            }
        });
    }
};
