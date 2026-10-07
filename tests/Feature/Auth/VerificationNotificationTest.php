<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class VerificationNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_authenticates_without_sending_a_verification_email(): void
    {
        Notification::fake();
        $this->post('/register', [
            'name' => 'New Student', 'email' => 'new-student@example.com',
            'password' => 'password', 'password_confirmation' => 'password',
        ])->assertRedirect('/student/dashboard');
        $user = User::where('email', 'new-student@example.com')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertNull($user->email_verified_at);
        $this->assertTrue(Hash::check('password', $user->password));
        Notification::assertNotSentTo($user, VerifyEmail::class);
        $this->get('/student/dashboard')->assertOk();
        $this->get('/student/schedules')->assertOk();
        $this->get('/student/attendance')->assertOk();
        $this->get('/settings/profile')->assertOk();
        $this->post('/logout')->assertRedirect('/');
        $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect('/student/dashboard');
        $this->get('/student/dashboard')->assertOk();
    }
}
