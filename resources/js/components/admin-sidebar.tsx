import {
    CalendarDays,
    FileSpreadsheet,
    Grid2X2,
    UserRound,
    Users,
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import type { SidebarLink } from '@/components/app-sidebar';

const items: SidebarLink[] = [
    { title: 'Profile', href: '/admin/profile', icon: UserRound },
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: Grid2X2,
        exact: true,
    },
    { title: 'Users', href: '/admin/users', icon: Users },
    {
        title: 'Classes & Schedules',
        href: '/admin/schedules',
        icon: CalendarDays,
    },
    { title: 'Reports', href: '/admin/reports', icon: FileSpreadsheet },
];
export default function AdminSidebar() {
    return <AppSidebar items={items} />;
}
