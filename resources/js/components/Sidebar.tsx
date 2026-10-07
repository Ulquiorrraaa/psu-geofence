import { Link } from '@inertiajs/react';

export default function Sidebar() {
    return (
        <div className="flex h-screen w-64 flex-col justify-between border-r border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {/* TOP SECTION */}
            <div>
                <div className="border-b border-gray-200 p-5 dark:border-neutral-800">
                    <h2 className="text-lg font-bold">GPS Attendance</h2>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                </div>

                <nav className="space-y-2 p-4 text-sm">
                    <Link
                        href="/dashboard"
                        className="block rounded p-2 hover:bg-gray-100 dark:hover:bg-neutral-800"
                    >
                        Dashboard
                    </Link>

                    <Link
                        href="/attendance"
                        className="block rounded p-2 hover:bg-gray-100 dark:hover:bg-neutral-800"
                    >
                        Attendance
                    </Link>

                    <Link
                        href="/schedules"
                        className="block rounded p-2 hover:bg-gray-100 dark:hover:bg-neutral-800"
                    >
                        Schedules
                    </Link>

                    <Link
                        href="/reports"
                        className="block rounded p-2 hover:bg-gray-100 dark:hover:bg-neutral-800"
                    >
                        Reports
                    </Link>

                    <Link
                        href="/users"
                        className="block rounded p-2 hover:bg-gray-100 dark:hover:bg-neutral-800"
                    >
                        Users
                    </Link>
                </nav>
            </div>

            {/* BOTTOM SECTION */}
            <div className="border-t border-gray-200 p-4 dark:border-neutral-800">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-gray-500">admin@school.edu</p>

                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="mt-3 w-full text-left text-sm text-red-500 hover:underline"
                >
                    Logout
                </Link>
            </div>
        </div>
    );
}
