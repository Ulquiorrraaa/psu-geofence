import { Head, Link, usePage, usePoll } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react';
import ProfileAvatar from '@/components/profile-avatar';
import GuardLayout from '@/layouts/guard-layout';

type Schedule = {
    id: number;
    subject: string;
    instructor: string;
    location: string | null;
    section: string | null;
    days: string[];
    start_time: string;
    end_time: string;
    state: string;
    next_session: { start: string; end: string } | null;
};
type RecordItem = {
    id: number;
    subject: string;
    date: string | null;
    status: string;
    time_in: string | null;
    time_out: string | null;
    source: string;
};
type Props = {
    student: {
        id: number;
        name: string;
        student_id: string;
        course: string;
        year: string;
        section: string;
        profile_picture_url: string | null;
    };
    schedules: Schedule[];
    records: {
        data: RecordItem[];
        total: number;
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
};
function dateTime(value: string) {
    return new Date(value).toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
function stateColor(state: string) {
    return state === 'Ongoing'
        ? 'bg-emerald-100 text-emerald-800'
        : state === 'Pending'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-gray-100 text-gray-600';
}
export default function StudentDetails() {
    const { student, schedules, records } = usePage<Props>().props;
    usePoll(30000, { only: ['schedules', 'records'] });
    const ongoing = schedules.filter((item) => item.state === 'Ongoing');
    const pending = schedules
        .filter((item) => item.state === 'Pending')
        .sort((a, b) =>
            (a.next_session?.start ?? '').localeCompare(
                b.next_session?.start ?? '',
            ),
        );

    return (
        <GuardLayout
            title="Student Details"
            subtitle="Schedules, class activity, and attendance history"
        >
            <Head title={student.name + ' — Student Details'} />
            <div className="w-full min-w-0 space-y-6 p-4 text-gray-900 sm:p-6 lg:p-8">
                <Link
                    href="/guard/student-tracking"
                    className="inline-flex items-center gap-2 font-semibold text-[#7d0b1c]"
                >
                    <ArrowLeft size={18} /> Back to Student Tracking
                </Link>
                <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#ecd9dc] bg-white p-5 shadow-sm">
                    <ProfileAvatar
                        name={student.name}
                        url={student.profile_picture_url}
                        className="size-20"
                    />
                    <div className="min-w-0">
                        <h2 className="text-2xl font-bold break-words text-[#7d0b1c]">
                            {student.name}
                        </h2>
                        <p className="mt-2 break-words text-gray-600">
                            {[
                                student.student_id,
                                student.course,
                                student.year,
                                student.section,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    </div>
                </section>
                <div className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-2xl border border-[#ecd9dc] bg-white p-5">
                        <h2 className="flex items-center gap-2 text-lg font-bold">
                            <Clock3 size={20} /> Ongoing classes
                        </h2>
                        {ongoing.length ? (
                            ongoing.map((item) => (
                                <div
                                    key={item.id}
                                    className="mt-4 rounded-xl bg-emerald-50 p-4"
                                >
                                    <p className="font-bold text-emerald-900">
                                        {item.subject}
                                    </p>
                                    <p className="mt-1 text-sm">
                                        {item.instructor} ·{' '}
                                        {item.location || 'Location not set'}
                                    </p>
                                    <p className="mt-1 text-sm">
                                        Until{' '}
                                        {item.next_session &&
                                            dateTime(item.next_session.end)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="mt-4 text-sm text-gray-500">
                                No ongoing class right now.
                            </p>
                        )}
                    </section>
                    <section className="rounded-2xl border border-[#ecd9dc] bg-white p-5">
                        <h2 className="flex items-center gap-2 text-lg font-bold">
                            <CalendarDays size={20} /> Next pending class
                        </h2>
                        {pending[0] ? (
                            <div className="mt-4 rounded-xl bg-amber-50 p-4">
                                <p className="font-bold text-amber-900">
                                    {pending[0].subject}
                                </p>
                                <p className="mt-1 text-sm">
                                    {pending[0].instructor} ·{' '}
                                    {pending[0].location || 'Location not set'}
                                </p>
                                <p className="mt-1 text-sm">
                                    {pending[0].next_session &&
                                        dateTime(pending[0].next_session.start)}
                                </p>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-gray-500">
                                No pending class scheduled.
                            </p>
                        )}
                    </section>
                </div>
                <section className="rounded-2xl border border-[#ecd9dc] bg-white p-5">
                    <h2 className="text-lg font-bold">
                        All registered schedules ({schedules.length})
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Class times use Philippine time. Activity refreshes
                        every 30 seconds.
                    </p>
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        {schedules.map((item) => (
                            <article
                                key={item.id}
                                className="min-w-0 rounded-xl border border-gray-200 p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <h3 className="font-bold break-words">
                                        {item.subject}
                                    </h3>
                                    <span
                                        className={
                                            'rounded-full px-3 py-1 text-xs font-semibold ' +
                                            stateColor(item.state)
                                        }
                                    >
                                        {item.state}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm break-words text-gray-600">
                                    {item.instructor} ·{' '}
                                    {item.location || 'Location not set'}
                                </p>
                                <p className="mt-2 text-sm">
                                    {item.days.join(', ') || 'Days not set'} ·{' '}
                                    {item.start_time}–{item.end_time}
                                </p>
                                {item.next_session && (
                                    <p className="mt-2 text-sm text-[#7d0b1c]">
                                        {item.state === 'Ongoing'
                                            ? 'Started: '
                                            : 'Next: '}
                                        {dateTime(item.next_session.start)}
                                    </p>
                                )}
                            </article>
                        ))}
                    </div>
                    {!schedules.length && (
                        <p className="mt-4 text-sm text-gray-500">
                            No registered schedules.
                        </p>
                    )}
                </section>
                <section className="overflow-hidden rounded-2xl border border-[#ecd9dc] bg-white">
                    <h2 className="p-5 text-lg font-bold">
                        Attendance history ({records.total} records)
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-sm">
                            <thead className="bg-[#fff5f6] text-[#7d0b1c]">
                                <tr>
                                    {[
                                        'Date',
                                        'Subject',
                                        'Status',
                                        'Time in',
                                        'Time out',
                                        'Recorded via',
                                    ].map((label) => (
                                        <th key={label} className="px-4 py-3">
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {records.data.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-gray-100"
                                    >
                                        <td className="px-4 py-3">
                                            {item.date || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.subject}
                                        </td>
                                        <td className="px-4 py-3 font-semibold">
                                            {item.status}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.time_in || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.time_out || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.source}
                                        </td>
                                    </tr>
                                ))}
                                {!records.data.length && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-8 text-center text-gray-500"
                                        >
                                            No attendance records yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {records.last_page > 1 && (
                        <nav
                            aria-label="Attendance history pages"
                            className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
                        >
                            <span>
                                Page {records.current_page} of{' '}
                                {records.last_page}
                            </span>
                            <div className="flex gap-3">
                                {records.prev_page_url && (
                                    <Link
                                        preserveScroll
                                        href={records.prev_page_url}
                                        className="rounded-lg border px-3 py-2"
                                    >
                                        Previous
                                    </Link>
                                )}
                                {records.next_page_url && (
                                    <Link
                                        preserveScroll
                                        href={records.next_page_url}
                                        className="rounded-lg border px-3 py-2"
                                    >
                                        Next
                                    </Link>
                                )}
                            </div>
                        </nav>
                    )}
                </section>
            </div>
        </GuardLayout>
    );
}
