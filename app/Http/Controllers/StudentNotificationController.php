<?php

namespace App\Http\Controllers;

use App\Models\StudentNotification;
use App\Services\StudentNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentNotificationController extends Controller
{
    public function index(Request $request, StudentNotificationService $service): JsonResponse
    {
        return response()->json($service->feed($request->user()))->header('Cache-Control', 'no-store');
    }

    public function read(Request $request, string $notification): JsonResponse
    {
        $notice = StudentNotification::where('user_id', $request->user()->id)->findOrFail($notification);
        if (! $notice->read_at) {
            $notice->update(['read_at' => now()]);
        }

        return response()->json(['href' => $notice->href]);
    }

    public function readAll(Request $request): JsonResponse
    {
        $data = $request->validate(['before_id' => ['required', 'integer', 'min:1']]);
        StudentNotification::where('user_id', $request->user()->id)->findOrFail($data['before_id']);
        StudentNotification::where('user_id', $request->user()->id)
            ->active()->where('id', '<=', $data['before_id'])->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
