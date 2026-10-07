import { Head, Link, usePage } from '@inertiajs/react';
import { Clock3, MapPin, UserRound, Users } from 'lucide-react';

import GuardLayout from '@/layouts/guard-layout';

type ClassItem = {
    id: number;
    subject: string;
    section: string;
    instructor: string;
    startTime: string;
    endTime: string;
    location: string;
    status: string;
    studentCount: number;
};

type PageProps = {
    classes?: ClassItem[];
};

const statusClasses: Record<string, string> = {
    Ongoing: 'bg-emerald-100 text-emerald-700',
    Upcoming: 'bg-amber-100 text-amber-700',
    Done: 'bg-gray-200 text-gray-700',
};

export default function GuardDashboardPage() {
    const { classes = [] } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Guard Dashboard" />

            <GuardLayout
                title="Guard Dashboard"
                subtitle="Current classes and student activity for today"
            >
                <div className="w-full min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
                    {/* OVERVIEW */}
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#efd4d9] bg-white p-4 shadow-sm">
                        <div>
                            <p className="text-sm font-semibold tracking-[0.14em] text-[#8a3d4c] uppercase">
                                Today
                            </p>

                            <h2 className="mt-1 text-xl font-bold text-[#3d0d15]">
                                Active class overview
                            </h2>
                        </div>

                        <span className="shrink-0 rounded-full bg-[#f8e3e7] px-3 py-1 text-sm font-semibold text-[#7d0b1c]">
                            {classes.length}{' '}
                            {classes.length === 1 ? 'class' : 'classes'}
                        </span>
                    </div>

                    {/* EMPTY STATE */}
                    {classes.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#d9c0c6] bg-white p-8 text-center text-[#5a3740]">
                            No classes are scheduled for today.
                        </div>
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {classes.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/guard/classes/${item.id}`}
                                    className="group block rounded-2xl border border-[#ecd9dc] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d2a1aa] hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-bold tracking-[0.12em] text-[#8a3d4c] uppercase">
                                                {item.subject}
                                            </p>

                                            <h3 className="mt-2 truncate text-2xl font-bold text-[#2d0b12]">
                                                {item.section}
                                            </h3>
                                        </div>

                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                                                statusClasses[item.status] ??
                                                'bg-gray-100 text-gray-700'
                                            } `}
                                        >
                                            {item.status}
                                        </span>
                                    </div>

                                    <div className="mt-5 space-y-3 text-sm text-[#4d2a33]">
                                        <div className="flex items-center gap-2">
                                            <UserRound
                                                size={16}
                                                className="shrink-0 text-[#7d0b1c]"
                                            />

                                            <span className="truncate">
                                                {item.instructor}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Clock3
                                                size={16}
                                                className="shrink-0 text-[#7d0b1c]"
                                            />

                                            <span>
                                                {item.startTime} -{' '}
                                                {item.endTime}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <MapPin
                                                size={16}
                                                className="shrink-0 text-[#7d0b1c]"
                                            />

                                            <span className="truncate">
                                                {item.location}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex items-center justify-between border-t border-[#f1e4e6] pt-4 text-sm text-[#5a3740]">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Users
                                                size={16}
                                                className="text-[#7d0b1c]"
                                            />
                                            {item.studentCount} students
                                        </div>

                                        <span className="font-semibold text-[#7d0b1c]">
                                            View details
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </GuardLayout>
        </>
    );
}
