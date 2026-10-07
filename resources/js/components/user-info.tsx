import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();

    return (
        <>
            <Avatar className="h-10 w-10 overflow-hidden rounded-full">
                <AvatarImage
                    src={user.profile_picture_url || user.avatar}
                    className="object-cover"
                    alt={user.name}
                />

                <AvatarFallback className="rounded-full bg-[#5E0B10] text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>

            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-white">
                    {user.name}
                </span>

                {showEmail && (
                    <span className="truncate text-xs text-white/70">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
