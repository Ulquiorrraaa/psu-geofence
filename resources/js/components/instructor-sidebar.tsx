import {
    CalendarDays,
    FileSpreadsheet,
    Grid2X2,
    UserPlus,
    UserRound,
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import type { SidebarLink } from '@/components/app-sidebar';

const items: SidebarLink[] = [
    { title: 'Profile', href: '/instructor/profile', icon: UserRound },
    {
        title: 'My Advisory Students',
        href: '/instructor/advisory-students',
        icon: UserRound,
    },
    { title: 'My Classes', href: '/dashboard', icon: Grid2X2, exact: true },
    { title: 'Schedules', href: '/schedules', icon: CalendarDays },
    {
        title: 'Attendance Sheet',
        href: '/attendance/create',
        icon: FileSpreadsheet,
        exact: true,
    },
    {
        title: 'Student Registration',
        href: '/instructor/student-registration',
        icon: UserPlus,
    },
];
export default function InstructorSidebar() {
    return <AppSidebar items={items} />;
}
