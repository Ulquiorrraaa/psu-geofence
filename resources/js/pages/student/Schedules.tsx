import { Head, usePage } from '@inertiajs/react';
import { CalendarDays, Clock3, MapPin, UserRound } from 'lucide-react';

type Schedule = {
    id: number;
    subject: string;
    section: string | null;
    instructor: string;
    start_time: string;
    end_time: string;
    location: string;
    days: string[];
};

type PageProps = { schedules: Schedule[] };

export default function StudentSchedules() {
    const { schedules = [] } = usePage().props as unknown as PageProps;

    return (
        <>
            <Head title="My Schedule" />
            <div className="min-h-screen px-4 py-6 sm:px-7 sm:py-8">
                <div className="mx-auto max-w-5xl">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-[#850027]">
                            Class Schedule
                        </h1>
                        <p className="mt-1 text-gray-600">
                            Your current class times and locations
                        </p>
                    </header>
                    {schedules.length ? (
                        <div className="divide-y divide-gray-200 border-y border-gray-200 bg-white">
                            {schedules.map((schedule) => (
                                <article
                                    key={schedule.id}
                                    className="grid gap-4 px-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6"
                                >
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-950">
                                            {schedule.subject}
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-600">
                                            {schedule.section
                                                ? `Section ${schedule.section}`
                                                : 'Class schedule'}
                                        </p>
                                    </div>
                                    <div className="grid gap-2 text-sm text-gray-700 sm:grid-cols-2 sm:gap-x-8">
                                        <span className="flex items-center gap-2">
                                            <CalendarDays size={16} />
                                            {schedule.days?.join(', ') ||
                                                'Days not set'}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <Clock3 size={16} />
                                            {schedule.start_time} -{' '}
                                            {schedule.end_time}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <MapPin size={16} />
                                            {schedule.location}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <UserRound size={16} />
                                            {schedule.instructor}
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="border-y border-gray-200 py-8 text-gray-600">
                            No class schedules are available yet.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
