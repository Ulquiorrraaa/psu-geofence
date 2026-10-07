<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Remove old unique constraint
        |--------------------------------------------------------------------------
        |
        | OLD:
        | schedule_id + student_id
        |
        | That allowed only ONE attendance record for a student
        | in a schedule forever.
        |
        */

        Schema::table('attendances', function (Blueprint $table) {
            $table->index(
                'schedule_id',
                'attendances_schedule_id_index'
            );
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropUnique(
                'attendance_schedule_student_unique'
            );
        });

        /*
        |--------------------------------------------------------------------------
        | Add attendance history fields
        |--------------------------------------------------------------------------
        */

        Schema::table('attendances', function (Blueprint $table) {
            $table->date('attendance_date')
                ->nullable()
                ->after('student_id');

            $table->timestamp('time_out')
                ->nullable()
                ->after('time_in');

            /*
            |--------------------------------------------------------------------------
            | GPS fields
            |--------------------------------------------------------------------------
            |
            | REMOVE these two if you already have latitude/longitude
            | in another migration.
            |
            */

            if (! Schema::hasColumn('attendances', 'latitude')) {
                $table->decimal(
                    'latitude',
                    10,
                    7
                )->nullable()->after('time_out');
            }

            if (! Schema::hasColumn('attendances', 'longitude')) {
                $table->decimal(
                    'longitude',
                    10,
                    7
                )->nullable()->after('latitude');
            }
        });

        /*
        |--------------------------------------------------------------------------
        | New unique constraint
        |--------------------------------------------------------------------------
        |
        | Student may attend the same schedule on different dates.
        |
        */

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

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex('attendances_schedule_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropUnique(
                'attendance_schedule_student_date_unique'
            );

            $table->dropColumn([
                'attendance_date',
                'time_out',
            ]);
        });

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
};
