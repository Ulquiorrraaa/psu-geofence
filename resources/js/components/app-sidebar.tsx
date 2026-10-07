import { Link, usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import ProfileAvatar from '@/components/profile-avatar';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';

interface AuthUser {
    id: number;
    name: string;
    email?: string;
    profile_picture_url?: string | null;
    role?: string;
}

interface PageProps {
    auth?: {
        user?: AuthUser;
    };

    [key: string]: unknown;
}

export interface SidebarLink {
    title: string;
    href: string;
    icon: React.ElementType;
    exact?: boolean;
}

export function AppSidebar({ items }: { items: SidebarLink[] }) {
    const { setOpenMobile } = useSidebar();
    const { auth } = usePage<PageProps>().props;

    const { url } = usePage();

    const user = auth?.user;

    const role = user?.role?.trim().toLowerCase() ?? '';

    const isAdmin = role === 'admin';

    const isStudent = role === 'student';

    const navigationItems = items;

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    const dashboardUrl = isAdmin
        ? '/admin/dashboard'
        : isStudent
          ? '/student/dashboard'
          : '/dashboard';

    /*
    |--------------------------------------------------------------------------
    | Portal
    |--------------------------------------------------------------------------
    */

    const portalName = isAdmin
        ? 'Admin Portal'
        : isStudent
          ? 'Student Portal'
          : 'Instructor Portal';

    /*
    |--------------------------------------------------------------------------
    | Role Label
    |--------------------------------------------------------------------------
    */

    const roleLabel = isAdmin
        ? 'Administrator'
        : isStudent
          ? 'Student'
          : 'Instructor';

    /*
    |--------------------------------------------------------------------------
    | Active Link
    |--------------------------------------------------------------------------
    */

    const isActiveLink = (item: SidebarLink) => {
        const currentUrl = url.split('?')[0];

        if (item.href.includes('?')) {
            return url === item.href;
        }

        if (item.exact) {
            return currentUrl === item.href;
        }

        return (
            currentUrl === item.href || currentUrl.startsWith(`${item.href}/`)
        );
    };

    /*
    |--------------------------------------------------------------------------
    | User Initial
    |--------------------------------------------------------------------------
    */

    return (
        <Sidebar
            collapsible="icon"
            className="border-r border-[#b12a4b] bg-[#970027] text-white"
        >
            <SidebarHeader className="border-b border-white/10 bg-[#970027] px-7 py-8 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-5">
                <Link
                    href={dashboardUrl}
                    prefetch
                    className="flex items-center gap-4 group-data-[collapsible=icon]:justify-center"
                >
                    <img
                        src="/images/psu-lubao-logo.png"
                        alt="Pampanga State University Lubao Campus"
                        width={48}
                        height={48}
                        className="size-12 shrink-0 rounded-full object-contain group-data-[collapsible=icon]:size-8"
                    />

                    <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                        <h1 className="text-[19px] leading-tight font-bold whitespace-nowrap text-white">
                            PSU Attendance
                        </h1>

                        <p className="mt-1 text-xs font-semibold tracking-[0.12em] whitespace-nowrap text-[#f6a7bb] uppercase">
                            {portalName}
                        </p>
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarContent className="bg-[#970027] px-4 py-6 group-data-[collapsible=icon]:px-2">
                <p className="mb-4 px-4 text-xs font-bold tracking-[0.14em] text-[#f5a4b8] uppercase group-data-[collapsible=icon]:hidden">
                    Navigation
                </p>

                <SidebarMenu className="gap-1">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;

                        const active = isActiveLink(item);

                        return (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={active}
                                    tooltip={{
                                        children: item.title,
                                    }}
                                    className={`h-12 rounded-2xl px-4 text-[16px] font-semibold group-data-[collapsible=icon]:justify-center ${
                                        active
                                            ? '!bg-white !text-[#970027] hover:!bg-white'
                                            : '!text-[#f3b2c1] hover:!bg-white/10 hover:!text-white'
                                    }`}
                                >
                                    <Link
                                        href={item.href}
                                        prefetch
                                        onClick={() => setOpenMobile(false)}
                                    >
                                        <Icon
                                            className="h-5 w-5 shrink-0"
                                            strokeWidth={1.9}
                                        />

                                        <span className="min-w-0 flex-1 whitespace-nowrap group-data-[collapsible=icon]:hidden">
                                            {item.title}
                                        </span>

                                        {active && (
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#970027] group-data-[collapsible=icon]:hidden" />
                                        )}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="border-t border-white/10 bg-[#970027] px-7 py-7 group-data-[collapsible=icon]:px-2">
                {user && (
                    <div className="mb-6 flex items-center gap-4 group-data-[collapsible=icon]:mb-2 group-data-[collapsible=icon]:justify-center">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ffd600] text-base font-bold text-[#970027]">
                            <ProfileAvatar
                                name={user.name}
                                url={user.profile_picture_url}
                            />
                        </div>

                        <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                            <p className="truncate text-[15px] font-bold text-white">
                                {user.name}
                            </p>

                            <p className="mt-0.5 text-sm text-[#f5b0c0] capitalize">
                                {roleLabel}
                            </p>
                        </div>
                    </div>
                )}

                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip="Sign Out"
                            className="h-12 rounded-xl px-1 text-[16px] font-semibold !text-[#f3aabd] group-data-[collapsible=icon]:justify-center hover:!bg-white/10 hover:!text-white"
                        >
                            <Link href="/logout" method="post" as="button">
                                <LogOut
                                    className="h-5 w-5 shrink-0"
                                    strokeWidth={1.9}
                                />

                                <span className="group-data-[collapsible=icon]:hidden">
                                    Sign Out
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
