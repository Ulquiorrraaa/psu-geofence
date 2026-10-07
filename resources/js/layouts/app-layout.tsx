import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import FlashFeedback from '@/components/flash-feedback';

import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

type AppLayoutProps = {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
};

export default function AppLayout({
    breadcrumbs = [],
    children,
}: AppLayoutProps) {
    const { url } = usePage();

    const currentPath = url.split('?')[0];

    /*
    |--------------------------------------------------------------------------
    | Guard Portal
    |--------------------------------------------------------------------------
    |
    | Guard pages already use GuardLayout.
    |
    | DO NOT wrap Guard pages inside AppSidebarLayout because doing so creates:
    |
    | 1. AppSidebar
    | 2. GuardSidebar
    |
    | at the same time.
    |
    */

    const isGuardRoute =
        currentPath === '/guard' || currentPath.startsWith('/guard/');

    if (isGuardRoute) {
        return <>{children}</>;
    }

    /*
    |--------------------------------------------------------------------------
    | Existing Student / Instructor / Admin Layout
    |--------------------------------------------------------------------------
    |
    | Keep all existing portals unchanged.
    |
    */

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <FlashFeedback />
            {children}
        </AppLayoutTemplate>
    );
}
