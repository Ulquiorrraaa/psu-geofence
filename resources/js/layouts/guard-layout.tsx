import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import FlashFeedback from '@/components/flash-feedback';

import GuardSidebar from '@/components/guard-sidebar';

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';

type GuardLayoutProps = {
    children: ReactNode;
    title: string;
    subtitle?: string;
};

type GuardPageProps = {
    auth?: {
        user?: {
            id?: number;
            name?: string | null;
            email?: string | null;
            role?: string | null;
        } | null;
    };

    [key: string]: unknown;
};

export default function GuardLayout({
    children,
    title,
    subtitle,
}: GuardLayoutProps) {
    const { props } = usePage<GuardPageProps>();

    const userName = props.auth?.user?.name?.trim() || 'Security Officer';

    return (
        <SidebarProvider defaultOpen={true}>
            <GuardSidebar />

            <SidebarInset className="h-svh min-h-0 min-w-0 overflow-hidden bg-[#f8f6f6]">
                {/* HEADER */}
                <header className="sticky top-0 z-40 flex min-h-[96px] w-full shrink-0 items-center border-b border-[#eadcdf] bg-white px-4 shadow-sm sm:px-6 lg:px-8">
                    <div className="flex w-full min-w-0 items-center justify-between gap-4">
                        {/* LEFT SIDE */}
                        <div className="flex min-w-0 items-center gap-4">
                            {/* COLLAPSE BUTTON */}
                            <SidebarTrigger className="shrink-0 rounded-lg text-[#7d0b1c] hover:bg-[#f8e3e7] hover:text-[#7d0b1c]" />

                            <div className="min-w-0">
                                <h1 className="truncate text-xl font-bold text-[#7d0b1c] sm:text-2xl">
                                    {title}
                                </h1>

                                {subtitle && (
                                    <p className="mt-1 truncate text-sm text-gray-500 sm:text-base">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* USER */}
                        <div className="hidden shrink-0 items-center gap-3 rounded-full bg-[#f9e9ec] px-4 py-2 sm:flex">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7d0b1c] text-sm font-bold text-white">
                                {userName.charAt(0).toUpperCase()}
                            </span>

                            <span className="max-w-[160px] truncate text-sm font-semibold text-[#3d0d15]">
                                {userName}
                            </span>
                        </div>
                    </div>
                </header>

                {/* CONTENT */}
                <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
                    <FlashFeedback />
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
