<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeploymentCheck extends Command
{
    protected $signature = 'deployment:check';

    protected $description = 'Check production configuration without changing settings or data';

    public function handle(): int
    {
        $checks = [
            'Production environment' => config('app.env') === 'production',
            'Debug disabled' => config('app.debug') === false,
            'HTTPS application URL' => filter_var(config('app.url'), FILTER_VALIDATE_URL) !== false
                && str_starts_with((string) config('app.url'), 'https://')
                && ! in_array(parse_url((string) config('app.url'), PHP_URL_HOST), ['localhost', '127.0.0.1', '::1', 'your-domain.example'], true),
            'Application key configured' => filled(config('app.key')),
            'Secure session cookies' => config('session.secure') === true,
            'Real email transport configured' => ! in_array(config('mail.default'), ['log', 'array'], true),
            'Production asset manifest exists' => is_file(public_path('build/manifest.json')),
            'Development asset marker excluded' => ! is_file(public_path('hot')),
            'Public upload link points to persistent storage' => realpath(public_path('storage')) !== false
                && realpath(public_path('storage')) === realpath(storage_path('app/public')),
            'Storage directory writable' => is_writable(storage_path()),
            'Cache directory writable' => is_writable(base_path('bootstrap/cache')),
        ];

        $checks['Valid email sender configured'] = filter_var(config('mail.from.address'), FILTER_VALIDATE_EMAIL) !== false
            && ! str_ends_with((string) config('mail.from.address'), '@example.com');
        if (config('mail.mailers.'.config('mail.default').'.transport') === 'smtp') {
            $host = (string) config('mail.mailers.'.config('mail.default').'.host');
            $checks['SMTP host configured'] = $host !== '' && ! str_contains($host, 'REPLACE_')
                && ! in_array($host, ['localhost', '127.0.0.1', '::1'], true);
        }

        try {
            DB::connection()->getPdo();
            $checks['Database reachable'] = true;
            $migrator = app('migrator');
            $files = $migrator->getMigrationFiles(database_path('migrations'));
            $checks['All migrations applied'] = $migrator->repositoryExists()
                && array_diff(array_keys($files), $migrator->getRepository()->getRan()) === [];
        } catch (\Throwable) {
            $checks['Database reachable and migrations verified'] = false;
        }

        foreach ($checks as $label => $passed) {
            $this->line(($passed ? 'PASS: ' : 'FAIL: ').$label);
        }
        $this->warn('Separately verify email delivery, scheduler and queue processes, backups and restore, HTTPS, and signed-in workflows on the deployed server.');

        return in_array(false, $checks, true) ? self::FAILURE : self::SUCCESS;
    }
}
