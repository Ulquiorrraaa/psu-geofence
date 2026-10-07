<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public static function accounts(): array
    {
        $cases = [];
        foreach (['student' => '/student/dashboard', 'instructor' => '/dashboard', 'admin' => '/admin/dashboard', 'guard' => '/guard/dashboard'] as $role => $dashboard) {
            foreach ([false, true] as $verified) {
                $cases[$role.($verified ? '-verified' : '-unverified')] = [$role, $dashboard, $verified];
            }
        }

        return $cases;
    }

    #[DataProvider('accounts')]
    public function test_login_dashboard_logout_and_login_again_do_not_require_verification(string $role, string $dashboard, bool $verified): void
    {
        $user = User::factory()->create(['role' => $role, 'email_verified_at' => $verified ? now() : null]);
        $credentials = ['email' => $user->email, 'password' => 'password'];
        $this->post('/login', $credentials)->assertRedirect($dashboard);
        $this->assertAuthenticatedAs($user);
        $this->get($dashboard)->assertOk();
        $this->get('/settings/profile')->assertOk();
        $this->get('/settings/security')->assertRedirect(route('password.confirm'));
        $this->post(route('password.confirm'), ['password' => 'password'])->assertSessionHasNoErrors();
        $this->get('/settings/security')->assertOk();
        $this->get('/settings/appearance')->assertOk();
        $this->assertSame($verified, $user->fresh()->email_verified_at !== null);
        $this->post('/logout')->assertRedirect('/');
        $this->assertGuest();
        $this->post('/login', $credentials)->assertRedirect($dashboard);
        $this->get($dashboard)->assertOk();
    }

    public function test_email_verification_routes_are_not_registered(): void
    {
        foreach (['verification.notice', 'verification.verify', 'verification.send'] as $name) {
            $this->assertFalse(Route::has($name));
        }
        $this->get('/email/verify')->assertNotFound();
    }

    public function test_an_unverified_student_can_reset_their_password_and_log_in(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create(['role' => 'student']);
        $this->post('/forgot-password', ['email' => $user->email])->assertSessionHasNoErrors();
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
            $this->post('/reset-password', [
                'token' => $notification->token, 'email' => $user->email,
                'password' => 'newpassword123', 'password_confirmation' => 'newpassword123',
            ])->assertSessionHasNoErrors()->assertRedirect('/login');

            return true;
        });
        $this->post('/login', ['email' => $user->email, 'password' => 'newpassword123'])->assertRedirect('/student/dashboard');
        $this->get('/student/dashboard')->assertOk();
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_an_unverified_student_can_use_authenticated_api_endpoints(): void
    {
        $user = User::factory()->unverified()->create(['role' => 'student']);
        $token = $this->postJson('/api/student/login', ['email' => $user->email, 'password' => 'password'])
            ->assertOk()->json('token');
        foreach (['profile', 'dashboard', 'schedules', 'attendance-history'] as $endpoint) {
            $this->withToken($token)->getJson('/api/student/'.$endpoint)->assertOk();
        }
        $this->withToken($token)->postJson('/api/student/logout')->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertNull($user->fresh()->email_verified_at);
    }
}
