<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/Users', [
            'users' => User::latest()->get([
                'id',
                'name',
                'email',
                'role',
                'year',
                'section',
                'adviser',
                'status',
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'in:student,instructor,guard,admin'],
            'year' => ['nullable', 'string'],
            'section' => ['nullable', 'string'],
            'adviser' => ['nullable', 'string'],
            'status' => ['required', 'in:Active,Inactive'],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'year' => $validated['year'] ?? null,
            'section' => $validated['section'] ?? null,
            'adviser' => $validated['adviser'] ?? null,
            'status' => $validated['status'],
        ]);

        return redirect()->back();
    }

    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->back();
    }
}
