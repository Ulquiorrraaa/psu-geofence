import { usePage } from '@inertiajs/react';
import AdminSidebar from '@/components/admin-sidebar';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import GuardSidebar from '@/components/guard-sidebar';
import InstructorSidebar from '@/components/instructor-sidebar';
import StudentSidebar from '@/components/student-sidebar';

import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    portalRole,
}: AppLayoutProps & { portalRole?: 'admin' | 'instructor' }) {
    const { auth } = usePage().props;
    const role = portalRole || auth.user.role;

    return (
        <AppShell variant="sidebar">
            <>
                {role === 'admin' ? (
                    <AdminSidebar />
                ) : role === 'instructor' ? (
                    <InstructorSidebar />
                ) : role === 'guard' ? (
                    <GuardSidebar />
                ) : (
                    <StudentSidebar />
                )}
            </>

            <AppContent
                variant="sidebar"
                className="h-svh min-h-0 min-w-0 flex-1 overflow-hidden"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />

                <div className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto overscroll-contain">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
