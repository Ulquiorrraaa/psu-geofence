<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (! Schema::hasColumn('attendances', 'attendance_date')) {
                $table->date('attendance_date')
                    ->nullable()
                    ->after('student_id');
            }

            if (! Schema::hasColumn('attendances', 'time_out')) {
                $table->timestamp('time_out')
                    ->nullable()
                    ->after('time_in');
            }

            if (! Schema::hasColumn('attendances', 'latitude')) {
                $table->decimal('latitude', 10, 7)
                    ->nullable()
                    ->after('time_out');
            }

            if (! Schema::hasColumn('attendances', 'longitude')) {
                $table->decimal('longitude', 10, 7)
                    ->nullable()
                    ->after('latitude');
            }
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'attendance_date')) {
                $table->dropColumn('attendance_date');
            }

            if (Schema::hasColumn('attendances', 'time_out')) {
                $table->dropColumn('time_out');
            }

            if (Schema::hasColumn('attendances', 'latitude')) {
                $table->dropColumn('latitude');
            }

            if (Schema::hasColumn('attendances', 'longitude')) {
                $table->dropColumn('longitude');
            }
        });
    }
};
