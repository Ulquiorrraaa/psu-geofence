import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ClipboardList,
    Home,
    LogOut,
    MapPin,
    UserRound,
} from 'lucide-react';

const items = [
    { label: 'Home', href: '/student/dashboard', icon: Home },
    { label: 'Schedule', href: '/student/schedules', icon: CalendarDays },
    { label: 'Attendance', href: '/student/attendance', icon: ClipboardList },
    { label: 'Profile', href: '/student/profile', icon: UserRound },
];

export default function StudentSidebar() {
    const { url, props } = usePage();
    const auth = props.auth as { user?: { name?: string } } | undefined;
    const pathname = url.split('?')[0];

    return (
        <>
            <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#850027] text-white md:flex">
                <Link
                    href="/student/dashboard"
                    className="flex items-center gap-3 border-b border-white/15 px-6 py-7"
                >
                    <span className="flex size-11 items-center justify-center rounded-full bg-[#ffd600] text-[#850027]">
                        <MapPin size={23} />
                    </span>
                    <span>
                        <span className="block font-bold">PSU Attendance</span>
                        <span className="mt-1 block text-xs font-semibold tracking-wider text-pink-200 uppercase">
                            Student Portal
                        </span>
                    </span>
                </Link>

                <nav
                    aria-label="Student navigation"
                    className="flex-1 space-y-2 px-4 py-7"
                >
                    {items.map(({ label, href, icon: Icon }) => {
                        const active = pathname === href;

                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-current={active ? 'page' : undefined}
                                className={`flex min-h-12 items-center gap-3 rounded-lg px-4 font-semibold transition-colors ${
                                    active
                                        ? 'bg-white text-[#850027]'
                                        : 'text-pink-100 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <Icon size={20} strokeWidth={1.9} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-white/15 px-6 py-5">
                    <p className="truncate text-sm font-semibold">
                        {auth?.user?.name ?? 'Student'}
                    </p>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="mt-4 flex items-center gap-3 text-sm font-semibold text-pink-200 hover:text-white"
                    >
                        <LogOut size={18} />
                        Sign out
                    </Link>
                </div>
            </aside>

            <nav
                aria-label="Student navigation"
                className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-gray-200 bg-white px-2 pt-2 pb-[env(safe-area-inset-bottom)] md:hidden"
            >
                {items.map(({ label, href, icon: Icon }) => {
                    const active = pathname === href;

                    return (
                        <Link
                            key={href}
                            href={href}
                            aria-current={active ? 'page' : undefined}
                            className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                                active ? 'text-[#850027]' : 'text-gray-600'
                            }`}
                        >
                            <Icon size={20} strokeWidth={1.9} />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
