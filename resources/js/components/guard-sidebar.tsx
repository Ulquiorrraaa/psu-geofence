import { Link, usePage } from '@inertiajs/react';
import { BarChart3, LogOut, UserSearch } from 'lucide-react';
import ProfileAvatar from '@/components/profile-avatar';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

const items = [
    { label: 'Profile', href: '/guard/profile', icon: UserSearch },
    {
        label: 'Dashboard',
        href: '/guard/dashboard',
        icon: BarChart3,
    },
    {
        label: 'Student Tracking',
        href: '/guard/student-tracking',
        icon: UserSearch,
    },
];

export default function GuardSidebar() {
    const { url, props } = usePage();

    const currentPath = url.split('?')[0];

    const userName = props.auth?.user?.name?.trim() || 'Security Officer';

    return (
        <Sidebar
            collapsible="icon"
            className="border-r border-[#4d0b14] bg-[#7d0b1c] text-white"
        >
            {/* HEADER */}
            <SidebarHeader className="border-b border-white/10 bg-[#7d0b1c] px-6 py-7 group-data-[collapsible=icon]:px-2">
                <Link
                    href="/guard/dashboard"
                    className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
                >
                    <img
                        src="/images/psu-lubao-logo.png"
                        alt="Pampanga State University Lubao Campus"
                        width={48}
                        height={48}
                        className="size-11 shrink-0 rounded-full object-contain group-data-[collapsible=icon]:size-8"
                    />

                    <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                        <span className="block text-[18px] leading-tight font-bold whitespace-nowrap text-white">
                            GPS Attendance
                        </span>

                        <span className="mt-1 block text-[10px] font-semibold tracking-[0.18em] whitespace-nowrap text-[#f6d1d8] uppercase">
                            Guard Portal
                        </span>
                    </span>
                </Link>
            </SidebarHeader>

            {/* CONTENT */}
            <SidebarContent className="bg-[#7d0b1c] px-4 py-7 group-data-[collapsible=icon]:px-2">
                <p className="mb-4 px-4 text-[10px] font-bold tracking-[0.18em] text-[#f4c4cf] uppercase group-data-[collapsible=icon]:hidden">
                    Menu
                </p>

                <SidebarMenu className="gap-2">
                    {items.map(({ label, href, icon: Icon }) => {
                        const active =
                            currentPath === href ||
                            currentPath.startsWith(`${href}/`);

                        return (
                            <SidebarMenuItem key={href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={active}
                                    tooltip={label}
                                    className={`h-12 rounded-xl px-4 font-semibold group-data-[collapsible=icon]:justify-center ${
                                        active
                                            ? '!bg-white !text-[#7d0b1c] hover:!bg-white hover:!text-[#7d0b1c]'
                                            : '!text-[#f4c4cf] hover:!bg-white/10 hover:!text-white'
                                    } `}
                                >
                                    <Link
                                        href={href}
                                        aria-current={
                                            active ? 'page' : undefined
                                        }
                                    >
                                        <Icon
                                            size={18}
                                            strokeWidth={2}
                                            className="shrink-0"
                                        />

                                        <span className="whitespace-nowrap group-data-[collapsible=icon]:hidden">
                                            {label}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>

            {/* FOOTER */}
            <SidebarFooter className="border-t border-white/10 bg-[#7d0b1c] px-6 py-5 group-data-[collapsible=icon]:px-2">
                <div className="mb-4 flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0d66a] text-sm font-bold text-[#7d0b1c]">
                        <ProfileAvatar
                            name={userName}
                            url={props.auth.user.profile_picture_url}
                            className="size-10"
                        />
                    </span>

                    <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                        <p className="truncate text-sm font-semibold text-white">
                            {userName}
                        </p>

                        <p className="text-xs whitespace-nowrap text-[#f4cad5]">
                            Security Officer
                        </p>
                    </div>
                </div>

                <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-[#f4c4cf] uppercase group-data-[collapsible=icon]:hidden">
                    Main Gate
                </p>

                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip="Log out"
                            className="h-11 rounded-xl px-3 font-semibold !text-[#f4c4cf] group-data-[collapsible=icon]:justify-center hover:!bg-white/10 hover:!text-white"
                        >
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="w-full"
                            >
                                <LogOut
                                    size={18}
                                    strokeWidth={2}
                                    className="shrink-0"
                                />

                                <span className="whitespace-nowrap group-data-[collapsible=icon]:hidden">
                                    Logout
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
