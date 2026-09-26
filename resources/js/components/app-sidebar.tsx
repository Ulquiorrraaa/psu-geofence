import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ClipboardList,
    FileSpreadsheet,
    Grid2X2,
    LogOut,
    MapPin,
    Users,
} from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar';

interface AuthUser {
    id: number;
    name: string;
    email?: string;
    role?: string;
}

interface PageProps {
    auth?: {
        user?: AuthUser;
    };
    [key: string]: unknown;
}

interface SidebarLink {
    title: string;
    href: string;
    icon: React.ElementType;
    exact?: boolean;
}

export function AppSidebar() {
    const { auth } = usePage<PageProps>().props;
    const { url } = usePage();

    const user = auth?.user;
    const isAdmin = user?.role === 'admin';

    const instructorNavItems: SidebarLink[] = [
        {
            title: 'My Classes',
            href: '/dashboard',
            icon: Grid2X2,
            exact: true,
        },
        {
            title: 'Attendance',
            href: '/attendance',
            icon: ClipboardList,
            exact: true,
        },
        {
            title: 'Attendance Sheet',
            href: '/attendance/create',
            icon: FileSpreadsheet,
            exact: true,
        },
        {
            title: 'Schedules',
            href: '/schedules',
            icon: CalendarDays,
            exact: true,
        },
    ];

    const adminNavItems: SidebarLink[] = [
        {
            title: 'Dashboard',
            href: '/admin/dashboard',
            icon: Grid2X2,
            exact: true,
        },
        {
            title: 'Attendance',
            href: '/admin/attendance',
            icon: ClipboardList,
            exact: true,
        },
        {
            title: 'Schedules',
            href: '/admin/schedules',
            icon: CalendarDays,
            exact: true,
        },
        {
            title: 'Reports',
            href: '/admin/reports',
            icon: FileSpreadsheet,
            exact: true,
        },
        {
            title: 'Users',
            href: '/admin/users',
            icon: Users,
            exact: true,
        },
    ];

    const navigationItems = isAdmin
        ? adminNavItems
        : instructorNavItems;

    const dashboardUrl = isAdmin
        ? '/admin/dashboard'
        : '/dashboard';

    const isActiveLink = (item: SidebarLink) => {
        const currentUrl = url.split('?')[0];

        if (item.exact) {
            return currentUrl === item.href;
        }

        return currentUrl.startsWith(item.href);
    };

    const getInitial = () => {
        if (!user?.name) {
            return 'U';
        }

        return user.name.trim().charAt(0).toUpperCase();
    };

    return (
        <Sidebar
            collapsible="offcanvas"
            className="border-r border-[#b12a4b] bg-[#970027] text-white"
        >
            {/* Logo and title */}
            <SidebarHeader className="border-b border-white/10 bg-[#970027] px-7 py-8">
                <Link
                    href={dashboardUrl}
                    prefetch
                    className="flex items-center gap-4"
                >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ffd600] text-[#970027]">
                        <MapPin
                            className="h-7 w-7"
                            strokeWidth={2.5}
                        />
                    </div>

                    <div className="min-w-0">
                        <h1 className="whitespace-nowrap text-[19px] font-bold leading-tight text-white">
                            PSU Attendance
                        </h1>

                        <p className="mt-1 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.12em] text-[#f6a7bb]">
                            {isAdmin
                                ? 'Admin Portal'
                                : 'Instructor Portal'}
                        </p>
                    </div>
                </Link>
            </SidebarHeader>

            {/* Navigation */}
            <SidebarContent className="bg-[#970027] px-4 py-6">
                <p className="mb-4 px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#f5a4b8]">
                    Navigation
                </p>

                <nav className="space-y-1">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActiveLink(item);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch
                                className={[
                                    'group flex min-h-12 w-full items-center gap-4 rounded-2xl px-4 py-3',
                                    'text-[16px] font-semibold transition-colors duration-200',
                                    active
                                        ? 'bg-white text-[#970027] shadow-sm'
                                        : 'text-[#f3b2c1] hover:bg-white/10 hover:text-white',
                                ].join(' ')}
                            >
                                <Icon
                                    className="h-5 w-5 shrink-0"
                                    strokeWidth={1.9}
                                />

                                <span className="min-w-0 flex-1 whitespace-nowrap">
                                    {item.title}
                                </span>

                                {active && (
                                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#970027]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </SidebarContent>

            {/* User and sign-out */}
            <SidebarFooter className="border-t border-white/10 bg-[#970027] px-7 py-7">
                {user && (
                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ffd600] text-base font-bold text-[#970027]">
                            {getInitial()}
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-[15px] font-bold text-white">
                                {user.name}
                            </p>

                            <p className="mt-0.5 text-sm capitalize text-[#f5b0c0]">
                                {isAdmin ? 'Administrator' : 'Instructor'}
                            </p>
                        </div>
                    </div>
                )}

                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="flex w-full items-center gap-4 rounded-xl px-1 py-2 text-left text-[16px] font-semibold text-[#f3aabd] transition hover:text-white"
                >
                    <LogOut
                        className="h-5 w-5 shrink-0"
                        strokeWidth={1.9}
                    />

                    <span>Sign Out</span>
                </Link>
            </SidebarFooter>
        </Sidebar>
    );
}