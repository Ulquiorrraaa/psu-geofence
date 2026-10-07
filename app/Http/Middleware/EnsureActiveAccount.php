<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveAccount
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_if($request->user()?->status === 'Inactive' && ! $request->routeIs('logout'), 403, 'This account is inactive.');

        return $next($request);
    }
}
