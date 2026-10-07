import { Head, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Timer,
    XCircle,
} from 'lucide-react';
import { useMemo } from 'react';

type AttendanceRecord = {
    id: number;

    status: 'Present' | 'Late' | 'Absent' | string;

    attendance_date: string | null;

    time_in: string | null;

    time_out: string | null;

    latitude?: string | null;

    longitude?: string | null;

    schedule?: {
        id: number;

        subject: string;

        section: string | null;

        instructor: string;

        location: string | null;

        start_time: string | null;

        end_time: string | null;
    } | null;
};

type PageProps = {
    attendance?: AttendanceRecord[];
};

export default function StudentAttendance() {
    const { attendance = [] } = usePage().props as unknown as PageProps;

    /*
    |--------------------------------------------------------------------------
    | Normalize Status
    |--------------------------------------------------------------------------
    */

    const normalizeStatus = (status?: string) => {
        return (status ?? '').trim().toLowerCase();
    };

    /*
    |--------------------------------------------------------------------------
    | Attendance Statistics
    |--------------------------------------------------------------------------
    */

    const statistics = useMemo(() => {
        const present = attendance.filter(
            (record) => normalizeStatus(record.status) === 'present',
        ).length;

        const late = attendance.filter(
            (record) => normalizeStatus(record.status) === 'late',
        ).length;

        const absent = attendance.filter(
            (record) => normalizeStatus(record.status) === 'absent',
        ).length;

        const total = attendance.length;

        /*
         * Screenshot-style calculation:
         *
         * Present / Total × 100
         */

        const percentage = total > 0 ? (present / total) * 100 : 0;

        return {
            present,
            late,
            absent,
            total,
            percentage,
        };
    }, [attendance]);

    /*
    |--------------------------------------------------------------------------
    | Group by Attendance Date
    |--------------------------------------------------------------------------
    */

    const groupedAttendance = useMemo(() => {
        const groups: Record<string, AttendanceRecord[]> = {};

        attendance.forEach((record) => {
            const date = record.attendance_date ?? 'Unknown Date';

            if (!groups[date]) {
                groups[date] = [];
            }

            groups[date].push(record);
        });

        return Object.entries(groups).sort(([dateA], [dateB]) => {
            if (dateA === 'Unknown Date') {
                return 1;
            }

            if (dateB === 'Unknown Date') {
                return -1;
            }

            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
    }, [attendance]);

    /*
    |--------------------------------------------------------------------------
    | Date Formatter
    |--------------------------------------------------------------------------
    */

    const formatDate = (value: string) => {
        if (value === 'Unknown Date') {
            return value;
        }

        const date = new Date(`${value}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date
            .toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
            })
            .toUpperCase();
    };

    /*
    |--------------------------------------------------------------------------
    | Time Formatter
    |--------------------------------------------------------------------------
    */

    const formatTime = (value?: string | null) => {
        if (!value) {
            return '—';
        }

        const pieces = value.substring(0, 5).split(':');

        if (pieces.length !== 2) {
            return value;
        }

        let hour = Number(pieces[0]);

        const minute = pieces[1];

        if (Number.isNaN(hour)) {
            return value;
        }

        const period = hour >= 12 ? 'PM' : 'AM';

        hour = hour % 12 || 12;

        return `${hour.toString().padStart(2, '0')}:${minute} ${period}`;
    };

    /*
    |--------------------------------------------------------------------------
    | Convert Time to Minutes
    |--------------------------------------------------------------------------
    */

    const toMinutes = (value?: string | null) => {
        if (!value) {
            return null;
        }

        const parts = value.substring(0, 5).split(':');

        if (parts.length !== 2) {
            return null;
        }

        const hours = Number(parts[0]);

        const minutes = Number(parts[1]);

        if (Number.isNaN(hours) || Number.isNaN(minutes)) {
            return null;
        }

        return hours * 60 + minutes;
    };

    /*
    |--------------------------------------------------------------------------
    | Calculate Duration
    |--------------------------------------------------------------------------
    */

    const getDuration = (record: AttendanceRecord) => {
        const start = toMinutes(record.time_in);

        const end = toMinutes(record.time_out);

        if (start === null || end === null) {
            return null;
        }

        let difference = end - start;

        if (difference < 0) {
            difference += 24 * 60;
        }

        const hours = Math.floor(difference / 60);

        const minutes = difference % 60;

        if (hours === 0) {
            return `${minutes}m`;
        }

        return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    };

    /*
    |--------------------------------------------------------------------------
    | Status Style
    |--------------------------------------------------------------------------
    */

    const getStatusStyle = (status: string) => {
        const value = normalizeStatus(status);

        if (value === 'present') {
            return {
                label: 'Present',

                icon: CheckCircle2,

                border: 'border-t-emerald-400',

                iconColor: 'text-emerald-500',

                badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            };
        }

        if (value === 'late') {
            return {
                label: 'Late',

                icon: AlertCircle,

                border: 'border-t-yellow-400',

                iconColor: 'text-yellow-500',

                badge: 'border-yellow-200 bg-yellow-50 text-yellow-700',
            };
        }

        return {
            label: 'Absent',

            icon: XCircle,

            border: 'border-t-red-400',

            iconColor: 'text-red-500',

            badge: 'border-red-200 bg-red-50 text-red-600',
        };
    };

    return (
        <>
            <Head title="My Attendance" />

            <div className="min-h-full bg-[#f5f6f8] px-4 py-6 sm:px-6 lg:px-7">
                <div className="w-full min-w-0">
                    <section className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                        {/* ============================================
                            OVERALL RATE
                        ============================================ */}

                        <div className="rounded-[20px] bg-[#980026] px-6 py-6 text-white shadow-lg">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold">
                                        Overall Rate
                                    </p>

                                    <h2 className="mt-1 text-4xl font-extrabold sm:text-5xl">
                                        {statistics.percentage.toFixed(1)}%
                                    </h2>
                                </div>

                                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white/10">
                                    <CalendarDays size={28} />
                                </div>
                            </div>

                            {/* Progress */}

                            <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/20">
                                <div
                                    className="h-full rounded-full bg-[#ffe500]"
                                    style={{
                                        width: `${Math.min(
                                            statistics.percentage,
                                            100,
                                        )}%`,
                                    }}
                                />
                            </div>

                            <div className="my-5 border-t border-white/10" />

                            {/* Counts */}

                            <div className="grid grid-cols-3 text-center">
                                <div>
                                    <div className="text-2xl font-bold">
                                        {statistics.present}
                                    </div>

                                    <div className="mt-1 text-sm">Present</div>
                                </div>

                                <div>
                                    <div className="text-2xl font-bold">
                                        {statistics.late}
                                    </div>

                                    <div className="mt-1 text-sm">Late</div>
                                </div>

                                <div>
                                    <div className="text-2xl font-bold">
                                        {statistics.absent}
                                    </div>

                                    <div className="mt-1 text-sm">Absent</div>
                                </div>
                            </div>
                        </div>

                        {/* ============================================
                            RECORDS
                        ============================================ */}

                        {attendance.length > 0 ? (
                            <div className="mt-6 space-y-7">
                                {groupedAttendance.map(([date, records]) => (
                                    <div key={date}>
                                        <h3 className="mb-3 font-bold tracking-[0.08em] uppercase">
                                            {formatDate(date)}
                                        </h3>

                                        <div className="space-y-3">
                                            {records.map((record) => {
                                                const style = getStatusStyle(
                                                    record.status,
                                                );

                                                const StatusIcon = style.icon;

                                                const isAbsent =
                                                    normalizeStatus(
                                                        record.status,
                                                    ) === 'absent';

                                                const duration =
                                                    getDuration(record);

                                                return (
                                                    <article
                                                        key={record.id}
                                                        className={`rounded-[20px] border border-t-[3px] border-gray-200 bg-white shadow-sm ${style.border}`}
                                                    >
                                                        <div className="px-5 py-4">
                                                            {/* TOP */}

                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex min-w-0 gap-3">
                                                                    <StatusIcon
                                                                        size={
                                                                            20
                                                                        }
                                                                        className={`mt-1 shrink-0 ${style.iconColor}`}
                                                                    />

                                                                    <div className="min-w-0">
                                                                        <h4 className="text-[16px] font-bold text-black sm:text-[17px]">
                                                                            {record
                                                                                .schedule
                                                                                ?.subject ??
                                                                                'Class unavailable'}
                                                                        </h4>

                                                                        <p className="mt-0.5 text-sm text-black">
                                                                            {isAbsent
                                                                                ? 'Not detected'
                                                                                : (record
                                                                                      .schedule
                                                                                      ?.location ??
                                                                                  'Location not set')}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <span
                                                                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${style.badge}`}
                                                                >
                                                                    {
                                                                        style.label
                                                                    }
                                                                </span>
                                                            </div>

                                                            <div className="my-4 border-t border-gray-100" />

                                                            {/* BOTTOM */}

                                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                                <div className="flex items-center gap-2 text-sm text-black">
                                                                    <Clock3
                                                                        size={
                                                                            16
                                                                        }
                                                                    />

                                                                    {isAbsent ? (
                                                                        <span>
                                                                            —
                                                                        </span>
                                                                    ) : (
                                                                        <span>
                                                                            {formatTime(
                                                                                record.time_in,
                                                                            )}

                                                                            <span className="mx-2 text-gray-500">
                                                                                →
                                                                            </span>

                                                                            {formatTime(
                                                                                record.time_out,
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {isAbsent ? (
                                                                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500">
                                                                        <XCircle
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                        No
                                                                        record
                                                                    </span>
                                                                ) : duration ? (
                                                                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#fff1f4] px-3 py-1.5 text-xs font-semibold text-[#980026]">
                                                                        <Timer
                                                                            size={
                                                                                14
                                                                            }
                                                                        />

                                                                        {
                                                                            duration
                                                                        }
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-6 flex min-h-[200px] items-center justify-center rounded-[18px] border border-dashed border-gray-300 bg-gray-50">
                                <div className="text-center">
                                    <CalendarDays
                                        size={36}
                                        className="mx-auto text-gray-400"
                                    />

                                    <p className="mt-3 font-semibold text-gray-700">
                                        No attendance records yet
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Your attendance history will appear
                                        here.
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
