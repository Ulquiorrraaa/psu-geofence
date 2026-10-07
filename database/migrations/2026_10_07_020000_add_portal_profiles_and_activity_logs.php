<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['profile_picture', 'phone', 'employee_id', 'department', 'assigned_area'] as $column) {
            if (! Schema::hasColumn('users', $column)) {
                Schema::table('users', fn (Blueprint $table) => $table->string($column)->nullable());
            }
        }
        if (! Schema::hasTable('activity_logs')) {
            Schema::create('activity_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('actor_id')->nullable()->index();
                $table->string('actor_name')->nullable();
                $table->string('role')->nullable();
                $table->string('action');
                $table->string('subject_type');
                $table->unsignedBigInteger('subject_id')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        // Retain profile data and audit history on rollback to avoid data loss.
    }
};
