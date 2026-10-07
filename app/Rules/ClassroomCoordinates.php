<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ClassroomCoordinates implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $parts = is_string($value) ? preg_split('/\s*,\s*/', trim($value)) : [];
        if (count($parts) !== 2 || ! is_numeric($parts[0]) || ! is_numeric($parts[1])
            || abs((float) $parts[0]) > 90 || abs((float) $parts[1]) > 180) {
            $fail('Coordinates must contain a valid latitude and longitude separated by a comma.');
        }
    }
}
