import { Head, router, usePage, usePoll } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Download,
    MapPin,
    RotateCcw,
    Search,
    ShieldCheck,
    Trash2,
    Users,
    XCircle,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { csvCell } from '@/lib/csv';

type Status = 'Present' | 'Absent' | 'Late';
type AttendanceRecord = {
    id: number;
    studentKey: number;
    scheduleId: number;
    studentId: string;
    name: string;
    className: string;
    date: string;
    time: string;
    timeOut: string;
    status: Status;
    location: string;
    coordinates: string;
    gpsLocked: boolean;
};
type PageProps = { instructorAttendanceRecords?: AttendanceRecord[] };
const controlClass =
    'h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-[#970027] focus:ring-2 focus:ring-[#970027]/10';
const badgeClass = {
    Present: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    Absent: 'bg-rose-50 text-rose-700 ring-rose-600/15',
    Late: 'bg-amber-50 text-amber-700 ring-amber-600/15',
};
function displayDate(value: string) {
    return value
        ? new Date(value + 'T12:00:00').toLocaleDateString('en-PH', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : 'Date unavailable';
}
export default function Attendance() {
    usePoll(15000, { only: ['instructorAttendanceRecords'] });
    const { instructorAttendanceRecords = [] } = usePage().props as PageProps;
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('All');
    const [classId, setClassId] = useState('All');
    const [from, setFrom] = useState('');
    const [through, setThrough] = useState('');
    const [page, setPage] = useState(1);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{
        message: string;
        error: boolean;
    } | null>(null);
    const deletionInProgress = useRef(false);
    const classes = useMemo(
        () =>
            Array.from(
                new Map(
                    instructorAttendanceRecords.map((record) => [
                        record.scheduleId,
                        record.className,
                    ]),
                ).entries(),
            ).sort((a, b) => a[1].localeCompare(b[1])),
        [instructorAttendanceRecords],
    );
    const invalidRange = Boolean(from && through && from > through);
    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return instructorAttendanceRecords
            .filter(
                (record) =>
                    !invalidRange &&
                    [record.studentId, record.name, record.className].some(
                        (value) => value.toLowerCase().includes(keyword),
                    ) &&
                    (status === 'All' || record.status === status) &&
                    (classId === 'All' ||
                        String(record.scheduleId) === classId) &&
                    (!from || record.date >= from) &&
                    (!through || record.date <= through),
            )
            .sort(
                (a, b) =>
                    (b.date ?? '').localeCompare(a.date ?? '') || b.id - a.id,
            );
    }, [
        instructorAttendanceRecords,
        search,
        status,
        classId,
        from,
        through,
        invalidRange,
    ]);
    const uniqueStudents = new Set(filtered.map((record) => record.studentKey))
        .size;
    const count = (value: Status) =>
        filtered.filter((record) => record.status === value).length;
    const pages = Math.max(1, Math.ceil(filtered.length / 20));
    const currentPage = Math.min(page, pages);
    const visible = filtered.slice((currentPage - 1) * 20, currentPage * 20);
    const hasFilters = Boolean(
        search || status !== 'All' || classId !== 'All' || from || through,
    );

    function reset() {
        setSearch('');
        setStatus('All');
        setClassId('All');
        setFrom('');
        setThrough('');
        setPage(1);
    }
    function handleDelete(record: AttendanceRecord) {
        if (
            record.gpsLocked ||
            deletionInProgress.current ||
            !window.confirm(
                'Delete the attendance record for ' +
                    record.name +
                    ' on ' +
                    displayDate(record.date) +
                    '?',
            )
        ) {
            return;
        }

        deletionInProgress.current = true;
        setDeletingId(record.id);
        setFeedback(null);
        router.delete('/attendance/' + record.id, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () =>
                setFeedback({
                    message: 'Attendance record deleted.',
                    error: false,
                }),
            onError: (errors) =>
                setFeedback({
                    message:
                        errors.status ||
                        'Unable to delete this record. Please try again.',
                    error: true,
                }),
            onFinish: () => {
                deletionInProgress.current = false;
                setDeletingId(null);
            },
        });
    }
    function exportData() {
        const headers = [
            'Date',
            'Student ID',
            'Name',
            'Class',
            'Time in (PHT)',
            'Time out (PHT)',
            'Status',
            'Location',
            'Coordinates',
            'GPS protected',
        ];
        const rows = filtered.map((record) => [
            record.date,
            record.studentId,
            record.name,
            record.className,
            record.time,
            record.timeOut,
            record.status,
            record.location,
            record.coordinates,
            record.gpsLocked ? 'Yes' : 'No',
        ]);
        const csv =
            '\uFEFF' +
            [headers, ...rows]
                .map((row) => row.map(csvCell).join(','))
                .join('\r\n');
        const url = URL.createObjectURL(
            new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
        );
        const link = document.createElement('a');
        link.href = url;
        link.download = 'attendance-history.csv';
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <>
            <Head title="Attendance History" />
            <main className="min-h-full w-full min-w-0 space-y-6 bg-[#f7f8fa] p-4 text-gray-900 sm:p-6 lg:p-8">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="mb-1 text-xs font-semibold tracking-widest text-[#970027] uppercase">
                            Class records
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-[#850027] sm:text-3xl">
                            Attendance History
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Review attendance across your classes. Times are
                            shown in Philippine time.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={exportData}
                        disabled={!filtered.length}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#970027] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#790020] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Download size={18} /> Export CSV
                    </button>
                </header>
                <section
                    aria-label="Attendance filters"
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
                >
                    <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-12">
                        <label className="min-w-0 text-xs font-semibold text-gray-600 xl:col-span-4">
                            Search records
                            <div className="relative mt-2">
                                <Search
                                    size={18}
                                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    value={search}
                                    onChange={(event) => {
                                        setSearch(event.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Student name, ID, or class"
                                    className={controlClass + ' pl-10'}
                                />
                            </div>
                        </label>
                        <label className="min-w-0 text-xs font-semibold text-gray-600 xl:col-span-2">
                            Class
                            <select
                                value={classId}
                                onChange={(event) => {
                                    setClassId(event.target.value);
                                    setPage(1);
                                }}
                                className={controlClass + ' mt-2'}
                            >
                                <option value="All">All classes</option>
                                {classes.map(([id, name]) => (
                                    <option key={id} value={String(id)}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="min-w-0 text-xs font-semibold text-gray-600 xl:col-span-2">
                            Status
                            <select
                                value={status}
                                onChange={(event) => {
                                    setStatus(event.target.value);
                                    setPage(1);
                                }}
                                className={controlClass + ' mt-2'}
                            >
                                <option value="All">All statuses</option>
                                {['Present', 'Late', 'Absent'].map((value) => (
                                    <option key={value}>{value}</option>
                                ))}
                            </select>
                        </label>
                        <label className="min-w-0 text-xs font-semibold text-gray-600 xl:col-span-2">
                            From
                            <input
                                type="date"
                                value={from}
                                max={through || undefined}
                                onChange={(event) => {
                                    setFrom(event.target.value);
                                    setPage(1);
                                }}
                                className={controlClass + ' mt-2'}
                            />
                        </label>
                        <label className="min-w-0 text-xs font-semibold text-gray-600 xl:col-span-2">
                            Through
                            <input
                                type="date"
                                value={through}
                                min={from || undefined}
                                onChange={(event) => {
                                    setThrough(event.target.value);
                                    setPage(1);
                                }}
                                className={controlClass + ' mt-2'}
                            />
                        </label>
                    </div>
                    {invalidRange && (
                        <p role="alert" className="mt-3 text-sm text-red-700">
                            Choose an end date on or after the start date.
                        </p>
                    )}
                    {hasFilters && (
                        <button
                            type="button"
                            onClick={reset}
                            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#970027]"
                        >
                            <RotateCcw size={14} /> Clear filters
                        </button>
                    )}
                </section>
                <section
                    aria-label="Filtered attendance totals"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {[
                        {
                            label: 'Attendance records',
                            value: filtered.length,
                            detail: uniqueStudents + ' unique students',
                            icon: Users,
                            color: 'text-[#850027]',
                            bg: 'bg-[#fff0f4]',
                        },
                        {
                            label: 'Present',
                            value: count('Present'),
                            detail: 'Recorded as present',
                            icon: CheckCircle2,
                            color: 'text-emerald-700',
                            bg: 'bg-emerald-50',
                        },
                        {
                            label: 'Late',
                            value: count('Late'),
                            detail: 'Recorded as late',
                            icon: Clock3,
                            color: 'text-amber-700',
                            bg: 'bg-amber-50',
                        },
                        {
                            label: 'Absent',
                            value: count('Absent'),
                            detail: 'Recorded as absent',
                            icon: XCircle,
                            color: 'text-rose-700',
                            bg: 'bg-rose-50',
                        },
                    ].map(({ label, value, detail, icon: Icon, color, bg }) => (
                        <div
                            key={label}
                            className="flex items-start justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    {label}
                                </p>
                                <p
                                    className={
                                        'mt-2 text-3xl font-bold tabular-nums ' +
                                        color
                                    }
                                >
                                    {value}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    {detail}
                                </p>
                            </div>
                            <span
                                className={
                                    'rounded-xl p-2.5 ' + color + ' ' + bg
                                }
                            >
                                <Icon size={20} />
                            </span>
                        </div>
                    ))}
                </section>
                {feedback && (
                    <p
                        role={feedback.error ? 'alert' : 'status'}
                        className={
                            'rounded-xl border p-4 text-sm ' +
                            (feedback.error
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700')
                        }
                    >
                        {feedback.message}
                    </p>
                )}
                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
                        <h2 className="font-semibold">
                            Attendance records{' '}
                            <span className="ml-1 text-sm font-normal text-gray-400">
                                ({filtered.length})
                            </span>
                        </h2>
                        <span className="text-xs text-gray-400">
                            Updates every 15 seconds
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                                <tr>
                                    {[
                                        'Student',
                                        'Class',
                                        'Date & time',
                                        'Status',
                                        'Location',
                                        'Action',
                                    ].map((label) => (
                                        <th key={label} className="px-5 py-4">
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((record) => (
                                    <tr
                                        key={record.id}
                                        className="border-t border-gray-100 transition hover:bg-gray-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="max-w-60 font-semibold break-words text-gray-900">
                                                {record.name}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500 tabular-nums">
                                                {record.studentId}
                                            </p>
                                        </td>
                                        <td className="max-w-60 px-5 py-4 break-words">
                                            {record.className}
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-medium whitespace-nowrap">
                                                {displayDate(record.date)}
                                            </p>
                                            <p className="mt-1 text-xs whitespace-nowrap text-gray-500 tabular-nums">
                                                In {record.time || '—'} · Out{' '}
                                                {record.timeOut || '—'}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={
                                                    'inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ' +
                                                    (badgeClass[
                                                        record.status
                                                    ] ||
                                                        'bg-gray-100 text-gray-700')
                                                }
                                            >
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="flex items-center gap-1.5">
                                                <MapPin
                                                    size={14}
                                                    className="shrink-0 text-gray-400"
                                                />
                                                <span className="max-w-48 break-words">
                                                    {record.location ||
                                                        'Location not set'}
                                                </span>
                                            </p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                {record.gpsLocked
                                                    ? 'GPS check-in'
                                                    : 'No GPS coordinates'}
                                            </p>
                                            {record.coordinates && (
                                                <p className="mt-1 max-w-52 text-xs break-words text-gray-500">
                                                    {record.coordinates}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            {record.gpsLocked ? (
                                                <span
                                                    title="GPS attendance cannot be changed or deleted manually"
                                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500"
                                                >
                                                    <ShieldCheck
                                                        size={17}
                                                        className="text-emerald-600"
                                                    />{' '}
                                                    Protected
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(record)
                                                    }
                                                    disabled={
                                                        deletingId !== null
                                                    }
                                                    aria-label={
                                                        'Delete attendance for ' +
                                                        record.name +
                                                        ' on ' +
                                                        record.date
                                                    }
                                                    title="Delete attendance record"
                                                    className="inline-flex size-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {!visible.length && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-14 text-center"
                                        >
                                            <Search
                                                size={28}
                                                className="mx-auto mb-3 text-gray-300"
                                            />
                                            <p className="font-semibold text-gray-700">
                                                {hasFilters
                                                    ? 'No matching attendance records'
                                                    : 'No attendance records yet'}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-400">
                                                {hasFilters
                                                    ? 'Try another search or clear your filters.'
                                                    : 'Records will appear when attendance is recorded for your classes.'}
                                            </p>
                                            {hasFilters && (
                                                <button
                                                    type="button"
                                                    onClick={reset}
                                                    className="mt-4 text-sm font-semibold text-[#970027]"
                                                >
                                                    Clear filters
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
                        <span>
                            Showing{' '}
                            {filtered.length ? (currentPage - 1) * 20 + 1 : 0}–
                            {Math.min(currentPage * 20, filtered.length)} of{' '}
                            {filtered.length} records
                        </span>
                        <nav
                            aria-label="Attendance pages"
                            className="flex items-center gap-3"
                        >
                            <button
                                type="button"
                                aria-label="Previous page"
                                disabled={currentPage === 1}
                                onClick={() => setPage(currentPage - 1)}
                                className="rounded-lg border p-2 hover:bg-gray-50 disabled:opacity-30"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span>
                                Page {currentPage} of {pages}
                            </span>
                            <button
                                type="button"
                                aria-label="Next page"
                                disabled={currentPage === pages}
                                onClick={() => setPage(currentPage + 1)}
                                className="rounded-lg border p-2 hover:bg-gray-50 disabled:opacity-30"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </nav>
                    </div>
                </section>
            </main>
        </>
    );
}
