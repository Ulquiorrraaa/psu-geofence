<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdvisoryStudentsController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('instructor/AdvisoryStudents', [
            'students' => User::query()->where('role', 'student')->where('adviser_id', $request->user()->id)->orderBy('name')->get(['id', 'name', 'student_id', 'email', 'course', 'year', 'section', 'status', 'profile_picture']),
        ]);
    }
}
