<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       Schema::create('schedules', function (Blueprint $table) {

    $table->foreignId('user_id')->constrained()->onDelete('cascade');

    $table->id();
    $table->string('subject');
    $table->string('instructor');
    $table->time('start_time');
    $table->time('end_time');
    $table->integer('students');
    $table->string('location');
    $table->string('coordinates');
    $table->string('radius');
    $table->json('days');
    $table->string('status')->default('Scheduled');
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
