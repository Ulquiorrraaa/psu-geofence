<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignId('schedule_id')
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('student_id')
                ->after('schedule_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->enum('status', [
                'Present',
                'Late',
                'Absent',
            ])->default('Absent');

            $table->timestamp('time_in')->nullable();

            $table->unique(
                ['schedule_id', 'student_id'],
                'attendance_schedule_student_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropUnique(
                'attendance_schedule_student_unique'
            );

            $table->dropForeign(['schedule_id']);
            $table->dropForeign(['student_id']);

            $table->dropColumn([
                'schedule_id',
                'student_id',
                'status',
                'time_in',
            ]);
        });
    }
};