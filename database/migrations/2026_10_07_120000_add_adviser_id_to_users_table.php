<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('adviser_id')->nullable()->constrained('users')->nullOnDelete();
        });
        $instructors = DB::table('users')->where('role', 'instructor')->get(['id', 'name']);
        foreach ($instructors->groupBy(fn ($user) => strtolower(trim($user->name))) as $name => $accounts) {
            if ($accounts->count() === 1) {
                DB::table('users')->where('role', 'student')->whereRaw('LOWER(TRIM(adviser)) = ?', [$name])->update(['adviser_id' => $accounts->first()->id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropConstrainedForeignId('adviser_id'));
    }
};
