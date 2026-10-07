<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminReportController;
use App\Http\Controllers\Admin\AdminScheduleController;
use App\Http\Controllers\Admin\PortalMonitoringController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AdvisoryStudentsController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ClassRegistrationController;
use App\Http\Controllers\GuardDashboardController;
use App\Http\Controllers\GuardStudentTrackingController;
use App\Http\Controllers\InstructorClassRegistrationController;
use App\Http\Controllers\InstructorDashboardController;
use App\Http\Controllers\InstructorStudentRegistrationController;
use App\Http\Controllers\PortalProfileController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\StudentAttendanceCheckInController;
use App\Http\Controllers\StudentAttendanceController;
use App\Http\Controllers\StudentDashboardController;
use App\Http\Controllers\StudentNotificationController;
use App\Http\Controllers\StudentPortalController;
use App\Http\Controllers\StudentRegistrationController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(
        Features::registration()
    ),
])->name('home');

/*
|--------------------------------------------------------------------------
| Student Information Registration
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This is completely separate from Register for Class.
|
| Example:
| /student-registration/xxxxxxxx
|
*/

Route::middleware([
    'auth',
    'student',
])->group(function () {

    Route::get(
        '/student-registration/{token}',
        [
            StudentRegistrationController::class,
            'show',
        ]
    )->name(
        'student-registration.show'
    );

    Route::post(
        '/student-registration/{token}',
        [
            StudentRegistrationController::class,
            'store',
        ]
    )->name(
        'student-registration.store'
    );
});

/*
|--------------------------------------------------------------------------
| Guard Routes
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth',
    'guard',
])->prefix('guard')->name('guard.')->group(function () {

    Route::get(
        '/dashboard',
        [
            GuardDashboardController::class,
            'index',
        ]
    )->name('dashboard');

    Route::get(
        '/student-tracking',
        [
            GuardStudentTrackingController::class,
            'index',
        ]
    )->name('student-tracking');

    Route::get('/student-tracking/{student}', [GuardStudentTrackingController::class, 'show'])->whereNumber('student')->name('student-tracking.show');

    Route::get(
        '/classes/{schedule}',
        [
            GuardDashboardController::class,
            'show',
        ]
    )->name('classes.show');
});

/*
|--------------------------------------------------------------------------
| Instructor Routes
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth',
    'instructor',
])->group(function () {
    Route::get('/instructor/advisory-students', [AdvisoryStudentsController::class, 'index'])->name('instructor.advisory-students');

    /*
    |--------------------------------------------------------------------------
    | Instructor Dashboard
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/dashboard',
        [
            InstructorDashboardController::class,
            'index',
        ]
    )->name('dashboard');

    /*
    |--------------------------------------------------------------------------
    | Class Details
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/classes/{schedule}',
        [
            InstructorDashboardController::class,
            'show',
        ]
    )->name('classes.show');

    /*
    |--------------------------------------------------------------------------
    | CLASS REGISTRATION LINK
    |--------------------------------------------------------------------------
    |
    | These routes manage the registration link for ONE specific class.
    |
    | They DO NOT affect:
    |
    | - StudentRegistrationLink
    | - StudentRegistration
    | - Other classes
    | - Student portal
    |
    */

    Route::get(
        '/instructor/classes/{schedule}/registration-link',
        [
            InstructorClassRegistrationController::class,
            'show',
        ]
    )->name(
        'instructor.registration-link.show'
    );

    Route::post(
        '/instructor/classes/{schedule}/registration-link',
        [
            InstructorClassRegistrationController::class,
            'store',
        ]
    )->name(
        'instructor.registration-link.store'
    );

    Route::patch(
        '/instructor/classes/{schedule}/registration-link/regenerate',
        [
            InstructorClassRegistrationController::class,
            'regenerate',
        ]
    )->name(
        'instructor.registration-link.regenerate'
    );

    Route::patch(
        '/instructor/classes/{schedule}/registration-link/disable',
        [
            InstructorClassRegistrationController::class,
            'disable',
        ]
    )->name(
        'instructor.registration-link.disable'
    );

    Route::patch(
        '/instructor/classes/{schedule}/registration-link/enable',
        [
            InstructorClassRegistrationController::class,
            'enable',
        ]
    )->name(
        'instructor.registration-link.enable'
    );

    /*
    |--------------------------------------------------------------------------
    | STUDENT INFORMATION REGISTRATION
    |--------------------------------------------------------------------------
    |
    | This is NOT class registration.
    |
    | This is used for registering:
    |
    | - Student number
    | - Year level
    | - Section
    |
    */

    Route::get(
        '/instructor/student-registration',
        [
            InstructorStudentRegistrationController::class,
            'index',
        ]
    )->name(
        'instructor.student-registration.index'
    );

    Route::post(
        '/instructor/student-registration/link',
        [
            InstructorStudentRegistrationController::class,
            'store',
        ]
    )->name(
        'instructor.student-registration.store'
    );

    Route::patch(
        '/instructor/student-registration/link/regenerate',
        [
            InstructorStudentRegistrationController::class,
            'regenerate',
        ]
    )->name(
        'instructor.student-registration.regenerate'
    );

    Route::patch(
        '/instructor/student-registration/link/disable',
        [
            InstructorStudentRegistrationController::class,
            'disable',
        ]
    )->name(
        'instructor.student-registration.disable'
    );

    Route::patch(
        '/instructor/student-registration/link/enable',
        [
            InstructorStudentRegistrationController::class,
            'enable',
        ]
    )->name(
        'instructor.student-registration.enable'
    );

    /*
    |--------------------------------------------------------------------------
    | Attendance Sheet
    |--------------------------------------------------------------------------
    */

    Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance');
    Route::delete('/attendance/{attendance}', [AttendanceController::class, 'destroy'])->name('attendance.destroy');

    Route::get(
        '/attendance/create',
        [
            AttendanceController::class,
            'create',
        ]
    )->name(
        'attendance.create'
    );

    Route::post(
        '/attendance',
        [
            AttendanceController::class,
            'store',
        ]
    )->name(
        'attendance.store'
    );

    /*
    |--------------------------------------------------------------------------
    | Instructor Schedules
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/schedules',
        [
            ScheduleController::class,
            'index',
        ]
    )->name(
        'schedules'
    );

    Route::post(
        '/schedules',
        [
            ScheduleController::class,
            'store',
        ]
    )->name(
        'schedules.store'
    );

    Route::put(
        '/schedules/{schedule}',
        [
            ScheduleController::class,
            'update',
        ]
    )->name(
        'schedules.update'
    );

    Route::patch(
        '/schedules/{schedule}/recording',
        [
            ScheduleController::class,
            'updateRecording',
        ]
    )->name(
        'schedules.recording'
    );

    Route::delete(
        '/schedules/{schedule}',
        [
            ScheduleController::class,
            'destroy',
        ]
    )->name(
        'schedules.destroy'
    );
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth',
    'admin',
])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Admin Dashboard
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/dashboard',
            [
                AdminDashboardController::class,
                'index',
            ]
        )->name(
            'dashboard'
        );

        /*
        |--------------------------------------------------------------------------
        | Admin Attendance
        |--------------------------------------------------------------------------
        */

        Route::get('/attendance', [AttendanceController::class, 'adminIndex'])->name(
            'attendance'
        );

        /*
        |--------------------------------------------------------------------------
        | Admin Schedules
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/schedules',
            [
                AdminScheduleController::class,
                'index',
            ]
        )->name(
            'schedules'
        );

        Route::post(
            '/schedules',
            [
                AdminScheduleController::class,
                'store',
            ]
        )->name(
            'schedules.store'
        );

        /*
        |--------------------------------------------------------------------------
        | Admin Reports
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/reports',
            [
                AdminReportController::class,
                'index',
            ]
        )->name(
            'reports'
        );

        /*
        |--------------------------------------------------------------------------
        | Admin Users
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/users',
            [
                UserController::class,
                'index',
            ]
        )->name(
            'users'
        );

        Route::post(
            '/users',
            [
                UserController::class,
                'store',
            ]
        )->name(
            'users.store'
        );

        /*
        |--------------------------------------------------------------------------
        | Assign Adviser
        |--------------------------------------------------------------------------
        */

        Route::put('/users/assign-adviser', [UserController::class, 'assignAdviser'])
            ->name('users.assign-adviser');
        /*
        |--------------------------------------------------------------------------
        | Delete User
        |--------------------------------------------------------------------------
        */

        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::put('/schedules/{schedule}', [AdminScheduleController::class, 'update'])->name('schedules.update');
        Route::delete('/schedules/{schedule}', [AdminScheduleController::class, 'destroy'])->name('schedules.destroy');
        Route::delete(
            '/users/{user}',
            [
                UserController::class,
                'destroy',
            ]
        )->name(
            'users.destroy'
        );
    });

/*
|--------------------------------------------------------------------------
| Student Routes
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth',
    'student',
])
    ->prefix('student')
    ->name('student.')
    ->group(function () {
        Route::get('/registration', [StudentRegistrationController::class, 'index'])->name('registration.index');
        Route::post('/registration/validate', [StudentRegistrationController::class, 'validateToken'])->name('registration.validate');
        Route::post('/registration', [StudentRegistrationController::class, 'storeFromPortal'])->name('registration.store');
        Route::get('/register/{token}', [StudentRegistrationController::class, 'show'])->name('registration.show');

        /*
        |--------------------------------------------------------------------------
        | Student Dashboard
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/dashboard',
            [
                StudentDashboardController::class,
                'index',
            ]
        )->name(
            'dashboard'
        );

        /*
        |--------------------------------------------------------------------------
        | REGISTER FOR CLASS
        |--------------------------------------------------------------------------
        |
        | QR CODE AND COPY LINK WILL OPEN:
        |
        | /student/register-class/{token}
        |
        | The token belongs to ONE Schedule only.
        |
        */

        Route::get(
            '/register-class',
            [
                ClassRegistrationController::class,
                'index',
            ]
        )->name(
            'class-registration.index'
        );

        Route::get(
            '/register-class/{token}',
            [
                ClassRegistrationController::class,
                'show',
            ]
        )->name(
            'class-registration.show'
        );

        Route::post(
            '/register-class/{token}',
            [
                ClassRegistrationController::class,
                'register',
            ]
        )->name(
            'class-registration.register'
        );

        /*
        |--------------------------------------------------------------------------
        | Student Schedules
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/schedules',
            [
                StudentPortalController::class,
                'schedules',
            ]
        )->name(
            'schedules'
        );

        /*
        |--------------------------------------------------------------------------
        | Student Attendance
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/attendance',
            [
                StudentAttendanceController::class,
                'index',
            ]
        )->name(
            'attendance'
        );

        Route::post(
            '/attendance/check-in',
            [
                StudentAttendanceCheckInController::class,
                'store',
            ]
        )->name(
            'attendance.check-in'
        );

        /*
        |--------------------------------------------------------------------------
        | Student Profile
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/profile',
            [
                StudentPortalController::class,
                'profile',
            ]
        )->name(
            'profile'
        );

        Route::get(
            '/profile/edit',
            [
                StudentPortalController::class,
                'editProfile',
            ]
        )->name(
            'profile.edit'
        );

        Route::patch(
            '/profile',
            [
                StudentPortalController::class,
                'updateProfile',
            ]
        )->name(
            'profile.update'
        );
    });

/*
|--------------------------------------------------------------------------
| Settings Routes
|--------------------------------------------------------------------------
*/

require __DIR__.'/settings.php';

// Portal profiles use the existing role middleware and authentication.
foreach (['admin', 'instructor', 'guard'] as $portalRole) {
    Route::middleware(['auth', $portalRole])->prefix($portalRole)->name($portalRole.'.')->group(function () {
        Route::get('/profile', [PortalProfileController::class, 'edit'])->name('profile');
        Route::patch('/profile', [PortalProfileController::class, 'update'])->name('profile.update');
    });
}
foreach (['admin', 'instructor', 'student', 'guard'] as $portalRole) {
    Route::post('/'.$portalRole.'/profile/picture', [PortalProfileController::class, 'picture'])
        ->middleware(['auth', $portalRole])->name($portalRole.'.profile.picture');
}
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/classes', [PortalMonitoringController::class, 'classes'])->name('classes');
    Route::get('/attendance-monitoring', [PortalMonitoringController::class, 'attendance'])->name('attendance-monitoring');
    Route::get('/activity-logs', [PortalMonitoringController::class, 'activity'])->name('activity-logs');
    Route::get('/users/{user}', [PortalMonitoringController::class, 'user'])->name('users.show');
    Route::patch('/users/{user}/status', [PortalMonitoringController::class, 'status'])->name('users.status');
});
Route::get('/admin/registrations', [PortalMonitoringController::class, 'registrations'])
    ->middleware(['auth', 'admin'])->name('admin.registrations');

Route::middleware(['auth', 'student'])->prefix('student/notifications')->name('student.notifications.')->group(function () {
    Route::get('/', [StudentNotificationController::class, 'index'])->name('index');
    Route::patch('/read-all', [StudentNotificationController::class, 'readAll'])->name('read-all');
    Route::patch('/{notification}/read', [StudentNotificationController::class, 'read'])->whereNumber('notification')->name('read');
});
