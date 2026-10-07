import FlashFeedback from '@/components/flash-feedback';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';
export default function InstructorLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs} portalRole="instructor">
            <FlashFeedback />
            {children}
        </AppSidebarLayout>
    );
}
