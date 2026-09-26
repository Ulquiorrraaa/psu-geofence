import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header
            className="
                flex h-16 shrink-0 items-center gap-2
                border-b border-[#720009]
                bg-[#74000C]
                px-6
                text-white
                transition-[width,height]
                ease-linear
                group-has-data-[collapsible=icon]/sidebar-wrapper:h-12
                md:px-4
            "
        >
            <div className="flex items-center gap-3">
                <SidebarTrigger
                    className="
                        text-white
                        hover:bg-[#8C0710]
                        hover:text-white
                        rounded-lg
                        p-2
                        transition-all
                    "
                />

                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}