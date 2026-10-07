import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-[86px] shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 text-[#8f001f] shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:px-6">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="rounded-lg p-2 text-[#8f001f] transition-all hover:bg-gray-100 hover:text-[#8f001f]" />

                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}
