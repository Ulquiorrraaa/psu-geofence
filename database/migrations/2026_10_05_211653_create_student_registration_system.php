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
        | Instructor Student Registration Links
        |--------------------------------------------------------------------------
        */

        if (! Schema::hasTable('student_registration_links')) {
            Schema::create(
                'student_registration_links',
                function (Blueprint $table) {
                    $table->id();

                    $table->foreignId('instructor_id')
                        ->constrained('users')
                        ->cascadeOnDelete();

                    $table->string('token', 100)
                        ->unique();

                    $table->boolean('is_active')
                        ->default(true);

                    $table->timestamp('expires_at')
                        ->nullable();

                    $table->timestamps();

                    /*
                     * One student-registration link record
                     * per instructor.
                     *
                     * Regenerating changes the token instead
                     * of creating duplicate records.
                     */
                    $table->unique(
                        'instructor_id'
                    );
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Registered Students
        |--------------------------------------------------------------------------
        */

        if (! Schema::hasTable('student_registrations')) {
            Schema::create(
                'student_registrations',
                function (Blueprint $table) {
                    $table->id();

                    $table->foreignId(
                        'registration_link_id'
                    )
                        ->constrained(
                            'student_registration_links'
                        )
                        ->cascadeOnDelete();

                    $table->foreignId(
                        'instructor_id'
                    )
                        ->constrained('users')
                        ->cascadeOnDelete();

                    $table->foreignId(
                        'student_id'
                    )
                        ->constrained('users')
                        ->cascadeOnDelete();

                    $table->string(
                        'student_number'
                    );

                    $table->string(
                        'year_level'
                    );

                    $table->string(
                        'section'
                    );

                    $table->string(
                        'status'
                    )
                        ->default('active');

                    $table->timestamp(
                        'registered_at'
                    );

                    $table->timestamps();

                    /*
                     * Student can only register once
                     * under the same instructor.
                     */
                    $table->unique([
                        'instructor_id',
                        'student_id',
                    ]);
                }
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'student_registrations'
        );

        Schema::dropIfExists(
            'student_registration_links'
        );
    }
};
