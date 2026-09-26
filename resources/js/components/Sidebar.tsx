import { Link } from '@inertiajs/react';

export default function Sidebar() {
    return (
        <div className="w-64 h-screen bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col justify-between">

            {/* TOP SECTION */}
            <div>
                <div className="p-5 border-b border-gray-200 dark:border-neutral-800">
                    <h2 className="text-lg font-bold">GPS Attendance</h2>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                </div>

                <nav className="p-4 space-y-2 text-sm">
                    <Link href="/dashboard" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800">
                        Dashboard
                    </Link>

                    <Link href="/attendance" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800">
                        Attendance
                    </Link>

                    <Link href="/schedules" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800">
                        Schedules
                    </Link>

                    <Link href="/reports" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800">
                        Reports
                    </Link>

                    <Link href="/users" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800">
                        Users
                    </Link>
                </nav>
            </div>

            {/* BOTTOM SECTION */}
            <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-gray-500">admin@school.edu</p>

                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="mt-3 w-full text-left text-red-500 text-sm hover:underline"
                >
                    Logout
                </Link>
            </div>
        </div>
    );
}