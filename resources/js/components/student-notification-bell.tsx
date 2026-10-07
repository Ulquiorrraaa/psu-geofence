import { router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck, LoaderCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Notice = {
    id: string;
    title: string;
    message: string;
    href: string;
    read_at: string | null;
    created_at: string;
};
type Feed = { notifications: Notice[]; unread_count: number };

async function request(url: string, data?: object) {
    const response = await fetch(url, {
        method: data ? 'PATCH' : 'GET',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN':
                document.querySelector<HTMLMetaElement>(
                    'meta[name="csrf-token"]',
                )?.content ?? '',
        },
        body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
        throw new Error('Unable to update notifications. Please try again.');
    }

    return response.json();
}

export default function StudentNotificationBell() {
    const { props } = usePage<{ studentNotifications: Notice[] }>();
    const initial = props.studentNotifications ?? [];
    const [feed, setFeed] = useState<Feed>(() => ({
        notifications: initial,
        unread_count: initial.filter((notice) => !notice.read_at).length,
    }));
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const mounted = useRef(true);
    const revision = useRef(0);
    const fetching = useRef(false);
    const refresh = useCallback(async () => {
        if (fetching.current) {
            return;
        }

        fetching.current = true;
        const version = revision.current;

        try {
            const next: Feed = await request('/student/notifications');

            if (mounted.current && version === revision.current) {
                setFeed(next);
                setError('');
            }
        } catch {
            if (mounted.current) {
                setError(
                    'Notifications could not refresh. Try opening the bell again.',
                );
            }
        } finally {
            fetching.current = false;
        }
    }, []);
    useEffect(() => {
        mounted.current = true;
        const initialRefresh = window.setTimeout(() => {
            void refresh();
        }, 0);
        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                void refresh();
            }
        }, 30000);
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                void refresh();
            }
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            mounted.current = false;
            window.clearTimeout(initialRefresh);
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [refresh]);

    async function markRead(notice?: Notice) {
        if (busy) {
            return;
        }

        if (notice?.read_at) {
            setOpen(false);
            router.visit(notice.href);

            return;
        }

        setBusy(true);
        setError('');
        revision.current += 1;
        const ids = notice
            ? [notice.id]
            : feed.notifications
                  .filter((item) => !item.read_at)
                  .map((item) => item.id);

        try {
            await request(
                notice
                    ? '/student/notifications/' + notice.id + '/read'
                    : '/student/notifications/read-all',
                notice
                    ? {}
                    : {
                          before_id: Math.max(
                              ...feed.notifications.map((item) =>
                                  Number(item.id),
                              ),
                          ),
                      },
            );
            revision.current += 1;

            if (!mounted.current) {
                return;
            }

            setFeed((current) => ({
                unread_count: Math.max(
                    0,
                    current.unread_count -
                        current.notifications.filter(
                            (item) => ids.includes(item.id) && !item.read_at,
                        ).length,
                ),
                notifications: current.notifications.map((item) =>
                    ids.includes(item.id)
                        ? {
                              ...item,
                              read_at: item.read_at ?? new Date().toISOString(),
                          }
                        : item,
                ),
            }));

            if (notice) {
                setOpen(false);
                router.visit(notice.href);
            } else {
                void refresh();
            }
        } catch {
            if (mounted.current) {
                setError(
                    'Could not mark notifications as read. Please try again.',
                );
            }
        } finally {
            if (mounted.current) {
                setBusy(false);
            }
        }
    }

    return (
        <DropdownMenu
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (next) {
                    void refresh();
                }
            }}
        >
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={
                        'Notifications, ' + feed.unread_count + ' unread'
                    }
                    className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-[#fafafa] text-gray-900 transition hover:bg-gray-100 sm:h-12 sm:w-12"
                >
                    <Bell size={21} strokeWidth={2} />
                    {feed.unread_count > 0 && (
                        <span className="absolute -top-1 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8b001f] px-1 text-[10px] font-bold text-white">
                            {feed.unread_count > 99 ? '99+' : feed.unread_count}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={12}
                className="w-[min(24rem,calc(100vw-2rem))] rounded-xl bg-white p-0 text-gray-900 shadow-xl"
            >
                <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-bold">Notifications</span>
                    <span
                        aria-live="polite"
                        className="text-xs font-normal text-gray-500"
                    >
                        {feed.unread_count} unread
                    </span>
                </DropdownMenuLabel>
                {feed.notifications.some((notice) => !notice.read_at) && (
                    <DropdownMenuItem
                        disabled={busy}
                        onSelect={(event) => {
                            event.preventDefault();
                            void markRead();
                        }}
                        className="mx-2 mb-2 cursor-pointer text-xs font-semibold text-[#8b001f]"
                    >
                        {busy ? (
                            <LoaderCircle className="animate-spin" />
                        ) : (
                            <CheckCheck />
                        )}{' '}
                        Mark all as read
                    </DropdownMenuItem>
                )}
                {error && (
                    <p role="alert" className="px-4 pb-3 text-xs text-red-700">
                        {error}
                    </p>
                )}
                <DropdownMenuSeparator className="m-0" />
                <div className="max-h-[min(26rem,60vh)] overflow-y-auto">
                    {feed.notifications.length ? (
                        feed.notifications.map((notice) => (
                            <DropdownMenuItem
                                key={notice.id}
                                disabled={busy}
                                onSelect={(event) => {
                                    event.preventDefault();
                                    void markRead(notice);
                                }}
                                className={
                                    'flex cursor-pointer items-start gap-3 rounded-none border-b border-gray-100 px-4 py-3 ' +
                                    (!notice.read_at ? 'bg-[#fff7f9]' : '')
                                }
                            >
                                <span
                                    aria-label={
                                        notice.read_at ? 'Read' : 'Unread'
                                    }
                                    className={
                                        'mt-1.5 size-2 shrink-0 rounded-full ' +
                                        (notice.read_at
                                            ? 'bg-transparent'
                                            : 'bg-[#8b001f]')
                                    }
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-[#8b001f]">
                                        {notice.title}
                                    </span>
                                    <span className="mt-1 block text-sm text-gray-600">
                                        {notice.message}
                                    </span>
                                    <time
                                        dateTime={notice.created_at}
                                        className="mt-1.5 block text-xs text-gray-400"
                                    >
                                        {new Date(
                                            notice.created_at,
                                        ).toLocaleString('en-PH', {
                                            timeZone: 'Asia/Manila',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit',
                                        })}
                                    </time>
                                </span>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <p className="px-4 py-8 text-center text-sm text-gray-500">
                            You’re all caught up. New updates will appear here.
                        </p>
                    )}
                </div>
                <p className="px-4 py-2 text-xs text-gray-500">
                    Recent updates · refreshes automatically
                </p>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
