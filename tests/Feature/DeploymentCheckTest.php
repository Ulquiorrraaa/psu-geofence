<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeploymentCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_check_rejects_development_settings_without_changing_them(): void
    {
        config(['app.env' => 'local', 'app.debug' => true, 'app.url' => 'http://localhost', 'mail.default' => 'log']);
        $this->artisan('deployment:check')->expectsOutput('FAIL: Production environment')
            ->expectsOutput('FAIL: Debug disabled')->expectsOutput('FAIL: HTTPS application URL')
            ->expectsOutput('FAIL: Real email transport configured')->assertExitCode(1);
        $this->assertSame('local', config('app.env'));
        $this->assertTrue(config('app.debug'));
    }
}
