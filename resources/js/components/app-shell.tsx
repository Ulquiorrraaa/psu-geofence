import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { SidebarProvider } from '@/components/ui/sidebar';
import type { AppVariant } from '@/types';

type Props = {
    children: ReactNode;
    variant?: AppVariant;
};

type PageProps = {
    sidebarOpen?: boolean;

    [key: string]: unknown;
};

export function AppShell({ children, variant = 'sidebar' }: Props) {
    const { sidebarOpen } = usePage<PageProps>().props;

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">{children}</div>
        );
    }

    return (
        <SidebarProvider
            defaultOpen={typeof sidebarOpen === 'boolean' ? sidebarOpen : true}
        >
            {children}
        </SidebarProvider>
    );
}
