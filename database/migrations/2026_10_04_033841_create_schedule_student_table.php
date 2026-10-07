<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('schedule_student')) {
            Schema::create('schedule_student', function (Blueprint $table) {
                $table->id();

                $table->foreignId('schedule_id')
                    ->constrained('schedules')
                    ->cascadeOnDelete();

                $table->foreignId('student_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                $table->timestamp('registered_at')
                    ->nullable();

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
    }
};
