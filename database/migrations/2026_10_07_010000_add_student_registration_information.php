<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Nullable additions preserve historical registration records.
        Schema::table('student_registrations', function (Blueprint $table) {
            $table->string('full_name')->nullable();
            $table->string('email')->nullable();
            $table->string('course')->nullable();
            $table->string('adviser_name')->nullable();
            $table->unique(['student_id', 'registration_link_id'], 'student_registration_student_link_unique');
        });
    }

    public function down(): void
    {
        Schema::table('student_registrations', function (Blueprint $table) {
            $table->dropUnique('student_registration_student_link_unique');
            $table->dropColumn(['full_name', 'email', 'course', 'adviser_name']);
        });
    }
};
