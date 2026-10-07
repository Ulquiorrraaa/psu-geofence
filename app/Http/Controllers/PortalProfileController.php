<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PortalProfileController extends Controller
{
    public function edit(Request $request)
    {
        return Inertia::render($request->user()->role.'/Profile', ['profile' => $request->user()]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:40'],
        ];
        foreach (match ($user->role) {
            'instructor' => ['employee_id', 'department'],
            'guard' => ['employee_id', 'assigned_area'],
            default => ['employee_id'],
        } as $field) {
            $rules[$field] = ['nullable', 'string', 'max:255'];
        }
        $validated = $request->validate($rules);
        $user->getConnection()->transaction(function () use ($user, $validated) {
            $user->fill($validated);
            if ($user->isDirty('email')) {
                $user->email_verified_at = null;
            }
            $user->save();
            if ($user->role === 'instructor') {
                $user->schedules()->update(['instructor' => $user->name]);
            }
        });

        return back()->with('success', 'Profile updated successfully.');
    }

    public function picture(Request $request)
    {
        $data = $request->validate([
            'profile_picture' => ['nullable', 'required_without:remove', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove' => ['sometimes', 'accepted'],
        ]);
        $user = $request->user();
        $previous = $user->profile_picture;
        $path = isset($data['remove']) ? null : $request->file('profile_picture')->store('profile-pictures', 'public');
        try {
            $user->update(['profile_picture' => $path]);
        } catch (\Throwable $exception) {
            if ($path) {
                Storage::disk('public')->delete($path);
            }
            throw $exception;
        }
        if ($previous && str_starts_with($previous, 'profile-pictures/')) {
            Storage::disk('public')->delete($previous);
        }

        return back()->with('success', 'Profile picture updated successfully.');
    }
}
