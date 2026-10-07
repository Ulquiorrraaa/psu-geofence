<?php

return [
    'grace_minutes' => max(0, (int) env('ATTENDANCE_GRACE_MINUTES', 15)),
    'early_minutes' => max(0, (int) env('ATTENDANCE_EARLY_MINUTES', 15)),
    'lookback_days' => max(2, (int) env('ATTENDANCE_LOOKBACK_DAYS', 7)),
];
