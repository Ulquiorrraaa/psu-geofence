import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';

import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';

export function NavUser() {
    const { auth } = usePage().props as any;
    const { state } = useSidebar();
    const isMobile = useIsMobile();

    if (!auth.user) {
        return null;
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="h-16 rounded-2xl !bg-[#8C0710] px-4 text-white hover:!bg-[#9E0B14] data-[state=open]:!bg-[#8C0710] data-[state=open]:!text-white [&_.bg-muted]:!bg-[#5E0B10] [&_.bg-sidebar-accent]:!bg-[#5E0B10] [&_p]:!text-white [&_span]:!text-white [&_svg]:!text-white"
                            data-test="sidebar-menu-button"
                        >
                            <UserInfo user={auth.user} />

                            <ChevronsUpDown className="ml-auto size-4 text-white" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg border-[#8C0710] bg-[#74000C] text-white"
                        align="end"
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                  ? 'left'
                                  : 'bottom'
                        }
                    >
                        {auth?.user && <UserMenuContent user={auth.user} />}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
