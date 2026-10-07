<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/Users', [
            'users' => User::latest()->get(['id', 'name', 'email', 'role', 'year', 'section', 'adviser', 'status', 'student_id', 'course', 'profile_picture', 'phone', 'employee_id', 'department', 'assigned_area']),
        ]);
    }

    private function validateUser(Request $request, ?User $user = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:8', Password::defaults()],
            'role' => ['required', 'in:student,instructor,guard,admin'],
            'student_id' => ['nullable', 'string', 'max:100'],
            'course' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'employee_id' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'assigned_area' => ['nullable', 'string', 'max:255'],
            'year' => ['nullable', 'string', 'max:100'],
            'section' => ['nullable', 'string', 'max:100'],
            'adviser' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:Active,Inactive'],
        ]);
        if (array_key_exists('adviser', $validated) && (! $user || $validated['adviser'] !== $user->adviser)) {
            $matches = User::where('role', 'instructor')->where('name', $validated['adviser'])->pluck('id');
            $validated['adviser_id'] = $matches->count() === 1 ? $matches->first() : null;
        }

        return $validated;
    }

    public function store(Request $request)
    {
        User::create($this->validateUser($request));

        return back()->with('success', 'Account created successfully.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $this->validateUser($request, $user);
        if ($request->user()->id === $user->id) {
            if ($validated['role'] !== 'admin' || $validated['status'] !== 'Active') {
                return back()->withErrors(['role' => 'You cannot remove your own administrative access.']);
            }
        }
        if ($user->role === 'instructor' && $validated['role'] !== 'instructor' && $user->schedules()->exists()) {
            return back()->withErrors(['role' => 'Reassign or remove this instructor’s classes before changing their role.']);
        }
        if (empty($validated['password'])) {
            unset($validated['password']);
        }
        $user->getConnection()->transaction(function () use ($user, $validated): void {
            $user->fill($validated);
            if ($user->isDirty('email')) {
                $user->email_verified_at = null;
            }
            if ($user->isDirty(['role', 'status', 'password'])) {
                $user->tokens()->delete();
            }
            $user->save();
            if ($user->role === 'instructor') {
                $user->schedules()->update(['instructor' => $user->name]);
            }
        });

        return back()->with('success', 'Account updated successfully.');
    }

    public function assignAdviser(Request $request)
    {
        $validated = $request->validate([
            'year' => ['required', 'string', 'max:100'],
            'section' => ['required', 'string', 'max:100'],
            'instructor_id' => ['required', 'integer', Rule::exists('users', 'id')->where('role', 'instructor')->where('status', 'Active')],
        ]);

        $count = DB::transaction(function () use ($validated): int {
            $instructor = User::whereKey($validated['instructor_id'])->where('role', 'instructor')->where('status', 'Active')->lockForUpdate()->first();
            if (! $instructor) {
                throw ValidationException::withMessages(['instructor_id' => 'Choose an active instructor.']);
            }
            $students = User::where('role', 'student')
                ->whereRaw('LOWER(TRIM(year)) = ?', [strtolower(trim($validated['year']))])
                ->whereRaw('LOWER(TRIM(section)) = ?', [strtolower(trim($validated['section']))])
                ->lockForUpdate()->get();

            if ($students->isEmpty()) {
                throw ValidationException::withMessages([
                    'section' => 'No students match this year level and section. Choose a group from the student records.',
                ]);
            }
            foreach ($students as $student) {
                $student->update(['adviser' => $instructor->name, 'adviser_id' => $instructor->id]);
            }

            return $students->count();
        });

        return back()->with('success', 'Adviser assigned to '.$count.' '.($count === 1 ? 'student.' : 'students.'));
    }

    public function destroy(Request $request, User $user)
    {
        if ($request->user()->id === $user->id) {
            return back()->withErrors(['user' => 'You cannot delete your own administrator account here.']);
        }
        $user->update(['status' => 'Inactive']);
        $user->tokens()->delete();

        return back()->with('success', 'Account deactivated successfully. Existing records were retained.');
    }
}
