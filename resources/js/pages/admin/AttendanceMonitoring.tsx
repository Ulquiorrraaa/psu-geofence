import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import type { RecordPage } from '@/components/admin-records';

type Attendance = {
    id: number;
    student?: { name: string; student_id: string };
    schedule?: {
        subject: string;
        instructor: string;
        user?: { name: string };
        start_time: string;
        end_time: string;
    };
    attendance_date: string;
    created_at: string;
    time_in: string | null;
    time_out: string | null;
    status: string;
    latitude: string | null;
    longitude: string | null;
};

const emptyFilters = {
    student: '',
    date: '',
    status: '',
    instructor: '',
    subject: '',
    section: '',
};
const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-[#850027] focus:ring-2 focus:ring-[#850027]/10';
const formatTime = (value: string | null) =>
    value
        ? new Date(value).toLocaleTimeString('en-PH', {
              timeZone: 'Asia/Manila',
              hour: 'numeric',
              minute: '2-digit',
          })
        : '—';

export default function AttendanceMonitoring() {
    const { records, filters, instructors } = usePage<{
        records: RecordPage<Attendance>;
        filters: Record<string, string>;
        instructors: { id: number; name: string }[];
    }>().props;
    const form = useForm({ ...emptyFilters, ...filters });
    const hasAdvancedFilters = Boolean(
        filters.instructor || filters.subject || filters.section,
    );

    return (
        <main className="min-h-full space-y-5 bg-[#f7f8fa] p-4 text-gray-900 sm:p-7">
            <Head title="Attendance" />
            <header>
                <h1 className="text-2xl font-bold text-[#850027] sm:text-3xl">
                    Attendance
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                    View student attendance across your classes.
                </p>
            </header>

            <form
                className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.get('/admin/attendance-monitoring', {
                        preserveState: true,
                        preserveScroll: true,
                    });
                }}
            >
                <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1fr)_180px_160px_auto]">
                    <label className="text-sm font-medium">
                        Search student
                        <input
                            className={inputClass}
                            placeholder="Name or student number"
                            maxLength={255}
                            value={form.data.student}
                            onChange={(event) =>
                                form.setData('student', event.target.value)
                            }
                        />
                    </label>
                    <label className="text-sm font-medium">
                        Date
                        <input
                            className={inputClass}
                            type="date"
                            value={form.data.date}
                            onChange={(event) =>
                                form.setData('date', event.target.value)
                            }
                        />
                    </label>
                    <label className="text-sm font-medium">
                        Status
                        <select
                            className={inputClass}
                            value={form.data.status}
                            onChange={(event) =>
                                form.setData('status', event.target.value)
                            }
                        >
                            <option value="">All statuses</option>
                            <option>Present</option>
                            <option>Late</option>
                            <option>Absent</option>
                        </select>
                    </label>
                    <div className="flex gap-2">
                        <button
                            disabled={form.processing}
                            className="rounded-lg bg-[#850027] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6d001f] disabled:opacity-50"
                        >
                            {form.processing ? 'Searching…' : 'Search'}
                        </button>
                        <button
                            type="button"
                            disabled={form.processing}
                            className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                            onClick={() =>
                                router.get('/admin/attendance-monitoring')
                            }
                        >
                            Clear
                        </button>
                    </div>
                </div>

                <details
                    open={hasAdvancedFilters || undefined}
                    className="border-t border-gray-100 pt-3"
                >
                    <summary className="w-fit cursor-pointer text-sm font-medium text-[#850027]">
                        More filters
                    </summary>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <label className="text-sm font-medium">
                            Instructor
                            <select
                                className={inputClass}
                                value={form.data.instructor}
                                onChange={(event) =>
                                    form.setData(
                                        'instructor',
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="">All instructors</option>
                                {instructors.map((user) => (
                                    <option
                                        key={user.id}
                                        value={String(user.id)}
                                    >
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="text-sm font-medium">
                            Subject
                            <input
                                className={inputClass}
                                maxLength={255}
                                placeholder="Subject name"
                                value={form.data.subject}
                                onChange={(event) =>
                                    form.setData('subject', event.target.value)
                                }
                            />
                        </label>
                        <label className="text-sm font-medium">
                            Section
                            <input
                                className={inputClass}
                                maxLength={100}
                                placeholder="Section"
                                value={form.data.section}
                                onChange={(event) =>
                                    form.setData('section', event.target.value)
                                }
                            />
                        </label>
                    </div>
                </details>
                {Object.values(form.errors).length > 0 && (
                    <p role="alert" className="text-sm text-red-700">
                        {Object.values(form.errors).join(' ')}
                    </p>
                )}
            </form>

            <section
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                aria-label="Attendance records"
                aria-busy={form.processing}
            >
                <div className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-600">
                    {records.total} {records.total === 1 ? 'record' : 'records'}{' '}
                    found
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                {[
                                    'Student',
                                    'Class',
                                    'Date',
                                    'Time in / out',
                                    'Status',
                                    'Details',
                                ].map((label) => (
                                    <th
                                        key={label}
                                        scope="col"
                                        className="px-4 py-3 font-semibold"
                                    >
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.data.map((row) => (
                                <tr
                                    key={row.id}
                                    className="align-top hover:bg-gray-50/60"
                                >
                                    <td className="px-4 py-4">
                                        <p className="font-semibold">
                                            {row.student?.name ||
                                                'Unavailable student'}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {row.student?.student_id ||
                                                'No student number'}
                                        </p>
                                    </td>
                                    <td className="px-4 py-4">
                                        {row.schedule?.subject ||
                                            'Unavailable class'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        {(
                                            row.attendance_date ||
                                            row.created_at
                                        )?.slice(0, 10)}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <p>
                                            {formatTime(row.time_in)}{' '}
                                            <span className="text-gray-400">
                                                /
                                            </span>{' '}
                                            {formatTime(row.time_out)}
                                        </p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span
                                            className={
                                                'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ' +
                                                (row.status === 'Present'
                                                    ? 'bg-green-100 text-green-800'
                                                    : row.status === 'Late'
                                                      ? 'bg-amber-100 text-amber-800'
                                                      : row.status === 'Absent'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-gray-100 text-gray-700')
                                            }
                                        >
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <details>
                                            <summary
                                                className="cursor-pointer font-medium whitespace-nowrap text-[#850027]"
                                                aria-label={
                                                    'View attendance details for ' +
                                                    (row.student?.name ||
                                                        'student')
                                                }
                                            >
                                                View
                                            </summary>
                                            <dl className="mt-3 min-w-48 space-y-3 text-xs">
                                                <div>
                                                    <dt className="text-gray-500">
                                                        Instructor
                                                    </dt>
                                                    <dd className="mt-1">
                                                        {row.schedule?.user
                                                            ?.name ||
                                                            row.schedule
                                                                ?.instructor ||
                                                            '—'}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-gray-500">
                                                        Class schedule
                                                    </dt>
                                                    <dd className="mt-1">
                                                        {row.schedule
                                                            ? row.schedule
                                                                  .start_time +
                                                              ' – ' +
                                                              row.schedule
                                                                  .end_time
                                                            : '—'}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-gray-500">
                                                        Location
                                                    </dt>
                                                    <dd className="mt-1">
                                                        {row.latitude != null &&
                                                        row.longitude !=
                                                            null ? (
                                                            <>
                                                                <span>
                                                                    GPS recorded
                                                                </span>
                                                                <span className="mt-1 block text-gray-500">
                                                                    {
                                                                        row.latitude
                                                                    }
                                                                    ,{' '}
                                                                    {
                                                                        row.longitude
                                                                    }
                                                                </span>
                                                            </>
                                                        ) : (
                                                            'No GPS recorded'
                                                        )}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </details>
                                    </td>
                                </tr>
                            ))}
                            {!records.data.length && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-12 text-center"
                                    >
                                        <p className="font-medium text-gray-700">
                                            No attendance found
                                        </p>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Try another date or clear your
                                            filters.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {records.links.filter((link) => link.url).length > 1 && (
                <nav
                    aria-label="Attendance pages"
                    className="flex flex-wrap gap-2"
                >
                    {records.links.map((link, index) =>
                        link.url ? (
                            <Link
                                key={index}
                                href={link.url}
                                aria-current={link.active ? 'page' : undefined}
                                className={
                                    'rounded-lg border px-3 py-2 text-sm ' +
                                    (link.active
                                        ? 'border-[#850027] bg-[#850027] text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50')
                                }
                            >
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            </Link>
                        ) : (
                            <span
                                key={index}
                                className="rounded-lg border px-3 py-2 text-sm text-gray-400"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ),
                    )}
                </nav>
            )}
        </main>
    );
}
