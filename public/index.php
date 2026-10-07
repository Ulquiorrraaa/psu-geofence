<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

/*
|--------------------------------------------------------------------------
| Check Maintenance Mode
|--------------------------------------------------------------------------
*/

if (
    file_exists(
        $maintenance =
            __DIR__.'/../storage/framework/maintenance.php'
    )
) {
    require $maintenance;
}

/*
|--------------------------------------------------------------------------
| Register Composer Autoloader
|--------------------------------------------------------------------------
*/

require __DIR__.'/../vendor/autoload.php';

/*
|--------------------------------------------------------------------------
| Bootstrap Laravel
|--------------------------------------------------------------------------
*/

/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

/*
|--------------------------------------------------------------------------
| Handle Incoming Request
|--------------------------------------------------------------------------
*/

$app->handleRequest(
    Request::capture()
);
