import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';
import FlashFeedback from '@/components/flash-feedback';
import ProfileAvatar from '@/components/profile-avatar';
import StudentNotificationBell from '@/components/student-notification-bell';
import StudentSidebar from '@/components/student-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

type StudentLayoutProps = {
    children: ReactNode;
    title?: string;
};

type AuthUser = {
    id?: number;
    name?: string | null;
    email?: string | null;
    profile_picture_url?: string | null;
    course?: string | null;
    year?: string | null;
    section?: string | null;
    student_id?: string | null;
};

type PageProps = {
    auth?: {
        user?: AuthUser | null;
    };
    student?: {
        name?: string | null;
        course?: string | null;
        year?: string | null;
        section?: string | null;
        student_id?: string | null;
    } | null;
    studentNotifications?: {
        id: string;
        title: string;
        message: string;
        href: string;
    }[];
};

export default function StudentLayout({
    children,
    title = 'Student Dashboard',
}: StudentLayoutProps) {
    const { props } = usePage<PageProps>();

    /*
     * Dashboard currently sends `student`.
     * Other pages may use globally shared `auth.user`.
     *
     * Supporting both prevents the header from disappearing
     * when navigating between student pages.
     */
    const student = props.student;
    const authUser = props.auth?.user;

    const studentName =
        student?.name?.trim() || authUser?.name?.trim() || 'Student';

    const course = student?.course || authUser?.course || '';

    const year = student?.year || authUser?.year || '';

    const section = student?.section || authUser?.section || '';

    const academicInfo = [course, year, section].filter(Boolean).join(' ');

    const profilePictureUrl = authUser?.profile_picture_url;

    return (
        <AppShell variant="sidebar">
            <div className="flex h-svh w-full min-w-0 overflow-hidden bg-[#f7f8fa]">
                {/* SIDEBAR */}
                <StudentSidebar />

                {/* PAGE AREA */}
                <SidebarInset className="h-full min-h-0 min-w-0 flex-1 bg-[#f7f8fa]">
                    {/* =====================================================
                        STUDENT HEADER
                    ===================================================== */}
                    <header className="sticky top-0 z-40 flex min-h-[86px] w-full shrink-0 items-center border-b border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                        <div className="flex w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                            {/* LEFT */}
                            <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                                {/* This now really opens/closes StudentSidebar */}
                                <SidebarTrigger className="h-10 w-10 shrink-0 rounded-lg text-gray-900 hover:bg-gray-100" />

                                <div className="min-w-0">
                                    <h1 className="truncate text-lg leading-tight font-bold text-[#8b001f] sm:text-xl">
                                        {title}
                                    </h1>

                                    <p className="mt-1 truncate text-xs text-gray-500 sm:text-sm">
                                        Welcome back, {studentName}
                                        {academicInfo && (
                                            <>
                                                {' — '}
                                                {academicInfo}
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* RIGHT */}
                            <div className="relative flex shrink-0 items-center">
                                <StudentNotificationBell />

                                <div className="mx-3 hidden h-10 w-px bg-gray-200 sm:block" />

                                {/* Profile */}
                                <ProfileAvatar
                                    name={studentName}
                                    url={profilePictureUrl}
                                    className="h-10 w-10 sm:h-11 sm:w-11"
                                />
                            </div>
                        </div>
                    </header>

                    {/* PAGE CONTENT */}
                    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pb-20 md:pb-0">
                        <FlashFeedback />
                        {children}
                    </main>
                </SidebarInset>
            </div>
        </AppShell>
    );
}
