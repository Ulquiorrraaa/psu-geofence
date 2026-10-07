<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasIndex(
            'attendances',
            'attendance_schedule_student_unique',
            'unique'
        )) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->dropUnique(
                    'attendance_schedule_student_unique'
                );
            });
        }

        Schema::table('attendances', function (Blueprint $table) {
            /*
            |--------------------------------------------------------------------------
            | Attendance Date
            |--------------------------------------------------------------------------
            */

            if (
                ! Schema::hasColumn(
                    'attendances',
                    'attendance_date'
                )
            ) {
                $table->date(
                    'attendance_date'
                )
                    ->nullable()
                    ->after('student_id');
            }

            /*
            |--------------------------------------------------------------------------
            | Time Out
            |--------------------------------------------------------------------------
            */

            if (
                ! Schema::hasColumn(
                    'attendances',
                    'time_out'
                )
            ) {
                $table->timestamp(
                    'time_out'
                )
                    ->nullable()
                    ->after('time_in');
            }

            /*
            |--------------------------------------------------------------------------
            | GPS Coordinates
            |--------------------------------------------------------------------------
            */

            if (
                ! Schema::hasColumn(
                    'attendances',
                    'latitude'
                )
            ) {
                $table->decimal(
                    'latitude',
                    10,
                    7
                )
                    ->nullable();
            }

            if (
                ! Schema::hasColumn(
                    'attendances',
                    'longitude'
                )
            ) {
                $table->decimal(
                    'longitude',
                    10,
                    7
                )
                    ->nullable();
            }
        });

        /*
        |--------------------------------------------------------------------------
        | New unique constraint
        |--------------------------------------------------------------------------
        */

        if (! Schema::hasIndex(
            'attendances',
            [
                'schedule_id',
                'student_id',
                'attendance_date',
            ],
            'unique'
        )) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->unique(
                    [
                        'schedule_id',
                        'student_id',
                        'attendance_date',
                    ],
                    'attendance_schedule_student_date_unique'
                );
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasIndex(
            'attendances',
            'attendance_schedule_student_date_unique',
            'unique'
        )) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->dropUnique(
                    'attendance_schedule_student_date_unique'
                );
            });
        }

        if (! Schema::hasIndex(
            'attendances',
            [
                'schedule_id',
                'student_id',
            ],
            'unique'
        )) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->unique(
                    [
                        'schedule_id',
                        'student_id',
                    ],
                    'attendance_schedule_student_unique'
                );
            });
        }
    }
};
