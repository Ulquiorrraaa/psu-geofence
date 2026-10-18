<?php

namespace App\Providers;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\StudentRegistration;
use App\Models\StudentRegistrationLink;
use App\Models\User;
use App\Observers\PortalActivityObserver;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL; // <-- 1. Added URL facade import
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        
        if ($this->app->isProduction()) {
            // Production must use the built manifest, even if a local hot marker was copied.
            Vite::useHotFile(storage_path('framework/production-vite.hot'));
            
            // <-- 2. Force HTTPS for Render deployment
            URL::forceScheme('https'); 
        }
        
        foreach ([User::class, Schedule::class, Attendance::class, StudentRegistration::class, StudentRegistrationLink::class] as $model) {
            $model::observe(PortalActivityObserver::class);
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}