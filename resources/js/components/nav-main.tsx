import { Link } from '@inertiajs/react';

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="mb-4 px-3 text-sm font-semibold text-white/70">
                Platform
            </SidebarGroupLabel>

            <SidebarMenu className="space-y-3">
                {items.map((item) => {
                    const active = isCurrentUrl(item.href);

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={`h-14 rounded-2xl px-5 text-lg font-bold transition-all ${
                                    active
                                        ? '!bg-[#8C0710] !text-white hover:!bg-[#8C0710]'
                                        : '!text-white hover:!bg-[#A60D16]'
                                } [&_svg]:!text-white`}
                            >
                                <Link
                                    href={item.href}
                                    prefetch
                                    className="flex items-center gap-4"
                                >
                                    {item.icon && (
                                        <item.icon className="h-5 w-5" />
                                    )}

                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
