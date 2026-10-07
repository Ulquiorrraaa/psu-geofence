import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ClipboardList,
    Home,
    LogOut,
    UserRound,
} from 'lucide-react';
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
    { label: 'Profile', href: '/student/profile', icon: UserRound },
    { label: 'Home', href: '/student/dashboard', icon: Home },
    { label: 'Schedule', href: '/student/schedules', icon: CalendarDays },
    { label: 'Attendance', href: '/student/attendance', icon: ClipboardList },
    {
        label: 'Register Class',
        href: '/student/register-class',
        icon: ClipboardList,
    },
    {
        label: 'Student Registration',
        href: '/student/registration',
        icon: UserRound,
    },
];

export default function StudentSidebar() {
    const { url, props } = usePage();
    const auth = props.auth as
        | { user?: { name?: string; profile_picture_url?: string | null } }
        | undefined;
    const pathname = url.split('?')[0];

    return (
        <>
            <Sidebar collapsible="icon" className="bg-[#850027] text-white">
                <SidebarHeader className="border-b border-white/15 bg-[#850027] px-6 py-7 group-data-[collapsible=icon]:px-2">
                    <Link
                        href="/student/dashboard"
                        className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
                    >
                        <img
                            src="/images/psu-lubao-logo.png"
                            alt="Pampanga State University Lubao Campus"
                            width={48}
                            height={48}
                            className="size-11 shrink-0 rounded-full object-contain group-data-[collapsible=icon]:size-8"
                        />
                        <span className="group-data-[collapsible=icon]:hidden">
                            <span className="block font-bold">
                                PSU Attendance
                            </span>
                            <span className="mt-1 block text-xs font-semibold tracking-wider text-pink-200 uppercase">
                                Student Portal
                            </span>
                        </span>
                    </Link>
                </SidebarHeader>

                <SidebarContent className="bg-[#850027] px-4 py-7 group-data-[collapsible=icon]:px-2">
                    <SidebarMenu className="gap-2">
                        {items.map(({ label, href, icon: Icon }) => {
                            const active =
                                pathname === href ||
                                (href === '/student/profile' &&
                                    pathname.startsWith(`${href}/`));

                            return (
                                <SidebarMenuItem key={href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={active}
                                        tooltip={{ children: label }}
                                        className={`h-12 rounded-lg px-4 font-semibold group-data-[collapsible=icon]:justify-center ${
                                            active
                                                ? '!bg-white !text-[#850027] hover:!bg-white'
                                                : '!text-pink-100 hover:!bg-white/10 hover:!text-white'
                                        }`}
                                    >
                                        <Link
                                            href={href}
                                            aria-current={
                                                active ? 'page' : undefined
                                            }
                                        >
                                            <Icon size={20} strokeWidth={1.9} />
                                            <span className="group-data-[collapsible=icon]:hidden">
                                                {label}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarContent>

                <SidebarFooter className="border-t border-white/15 bg-[#850027] px-6 py-5 group-data-[collapsible=icon]:px-2">
                    <ProfileAvatar
                        name={auth?.user?.name}
                        url={auth?.user?.profile_picture_url}
                    />
                    <p className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
                        {auth?.user?.name ?? 'Student'}
                    </p>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                tooltip="Sign out"
                                className="mt-2 font-semibold !text-pink-200 group-data-[collapsible=icon]:justify-center hover:!bg-white/10 hover:!text-white"
                            >
                                <Link href="/logout" method="post" as="button">
                                    <LogOut size={18} />
                                    <span className="group-data-[collapsible=icon]:hidden">
                                        Sign out
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            <nav
                aria-label="Student navigation"
                className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-gray-200 bg-white px-2 pt-2 pb-[env(safe-area-inset-bottom)] md:hidden"
            >
                {items.map(({ label, href, icon: Icon }) => {
                    const active =
                        pathname === href ||
                        (href === '/student/profile' &&
                            pathname.startsWith(`${href}/`));

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
