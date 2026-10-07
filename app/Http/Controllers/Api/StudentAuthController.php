<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class StudentAuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string'],
        ]);
        $user = User::where('email', $validated['email'])->first();
        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Invalid email or password'], 401);
        }
        if ($user->role !== 'student' || $user->status === 'Inactive') {
            return response()->json(['message' => 'This account cannot access the student app'], 403);
        }
        // Password-only token login must never bypass enabled two-factor authentication.
        if ($user->hasEnabledTwoFactorAuthentication()) {
            return response()->json(['message' => 'Sign in through the website using two-factor authentication.'], 403);
        }
        $token = $user->createToken('student-app-token', ['*'], now()->addDay())->plainTextToken;

        return response()->json(['message' => 'Login successful', 'token' => $token, 'user' => $user]);
    }

    public function profile(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        return response()->json(['message' => 'Logged out successfully']);
    }
}
