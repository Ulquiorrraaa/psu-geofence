import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';

import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';

import { logout } from '@/routes';
import { edit } from '@/routes/profile';

import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <div className="rounded-2xl bg-[#74000C] text-white">
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 rounded-t-2xl bg-[#8C0710] px-3 py-3 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-[#A60D16]" />

            <DropdownMenuGroup>
                <DropdownMenuItem
                    asChild
                    className="cursor-pointer text-white hover:bg-[#8C0710] focus:bg-[#8C0710] focus:text-white"
                >
                    <Link
                        className="flex w-full items-center"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-[#A60D16]" />

            <DropdownMenuItem
                asChild
                className="cursor-pointer text-white hover:bg-[#8C0710] focus:bg-[#8C0710] focus:text-white"
            >
                <Link
                    className="flex w-full items-center"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </div>
    );
}
