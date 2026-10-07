<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'student_id')) {
                $table->string('student_id')->nullable()->after('email');
            }

            if (! Schema::hasColumn('users', 'course')) {
                $table->string('course')->nullable()->after('student_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'course')) {
                $table->dropColumn('course');
            }

            if (Schema::hasColumn('users', 'student_id')) {
                $table->dropColumn('student_id');
            }
        });
    }
};
