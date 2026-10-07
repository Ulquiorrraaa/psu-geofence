import { Head, router, usePage } from '@inertiajs/react';

import {
    BookOpen,
    CalendarDays,
    Check,
    ChevronRight,
    Clock3,
    Copy,
    Link2,
    MapPin,
    Share2,
    TrendingUp,
    UserRound,
    Users,
    X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type ClassAttendance = {
    id?: number;
    className: string;
    present: number;
    absent: number;
    studentCount?: number;
};

type InstructorStats = {
    myClasses: number;
    totalStudents: number;
    averageAttendance: number;
    classesToday: number;
};

type TodayClass = {
    id: number;

    className: string;

    section?: string | null;

    startTime: string;

    endTime: string;

    location: string;

    studentCount: number;

    presentCount: number;

    status: string;

    registrationUrl: string;
};

type PageProps = {
    instructorStats?: InstructorStats;

    classAttendance?: ClassAttendance[];

    todayClasses?: TodayClass[];
};

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

export default function Dashboard() {
    const {
        instructorStats = {
            myClasses: 0,
            totalStudents: 0,
            averageAttendance: 0,
            classesToday: 0,
        },

        classAttendance = [],

        todayClasses = [],
    } = usePage().props as PageProps;

    /*
    |--------------------------------------------------------------------------
    | Share modal
    |--------------------------------------------------------------------------
    */

    const [shareClass, setShareClass] = useState<TodayClass | null>(null);

    /*
    |--------------------------------------------------------------------------
    | Prevent page scrolling while modal is open
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!shareClass) {
            return;
        }

        const originalOverflow = document.body.style.overflow;

        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [shareClass]);

    /*
    |--------------------------------------------------------------------------
    | Close modal with Escape
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!shareClass) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShareClass(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [shareClass]);

    return (
        <>
            <Head title="My Classes" />

            <main className="min-h-full bg-[#f7f8fa] px-5 py-7 text-black sm:px-7 lg:px-8">
                <div className="w-full min-w-0">
                    {/* ====================================================
                        HEADER
                    ==================================================== */}

                    <section className="mb-7">
                        <h1 className="text-[30px] font-bold tracking-tight text-[#920025]">
                            My Classes Overview
                        </h1>

                        <p className="mt-1 text-[16px] text-black">
                            Track attendance and share registration links
                        </p>
                    </section>

                    {/* ====================================================
                        STAT CARDS
                    ==================================================== */}

                    <section className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="MY CLASSES"
                            value={instructorStats.myClasses}
                            footer="Active"
                            footerClass="text-[#9b0028]"
                            icon={<BookOpen size={27} strokeWidth={2} />}
                            iconClass="bg-[#fff0f3] text-[#9b0028]"
                        />

                        <StatCard
                            title="TOTAL STUDENTS"
                            value={instructorStats.totalStudents}
                            footer="Enrolled"
                            footerClass="text-blue-600"
                            icon={<Users size={28} strokeWidth={2} />}
                            iconClass="bg-blue-50 text-blue-600"
                        />

                        <StatCard
                            title="AVG. ATTENDANCE"
                            value={`${formatPercentage(
                                instructorStats.averageAttendance,
                            )}%`}
                            footer="Attendance Rate"
                            footerClass="text-emerald-600"
                            icon={<TrendingUp size={28} strokeWidth={2} />}
                            iconClass="bg-emerald-50 text-emerald-600"
                        />

                        <StatCard
                            title="CLASSES TODAY"
                            value={instructorStats.classesToday}
                            footer="Scheduled"
                            footerClass="text-orange-500"
                            icon={<CalendarDays size={27} strokeWidth={2} />}
                            iconClass="bg-orange-50 text-orange-500"
                        />
                    </section>

                    {/* ====================================================
                        CHART
                    ==================================================== */}

                    <section className="mb-7 overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm">
                        <div className="px-7 pt-7 sm:px-8">
                            <h2 className="text-[23px] font-bold">
                                Class Attendance Overview
                            </h2>

                            <p className="mt-2 text-[15px] text-black">
                                Present vs. absent across all classes
                            </p>
                        </div>

                        {classAttendance.length > 0 ? (
                            <div className="h-[360px] w-full px-4 pt-4 pb-5 sm:px-7">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={classAttendance}
                                        margin={{
                                            top: 10,
                                            right: 15,
                                            left: 0,
                                            bottom: 5,
                                        }}
                                        barGap={4}
                                    >
                                        <CartesianGrid
                                            vertical={false}
                                            stroke="#e5e7eb"
                                            strokeDasharray="4 4"
                                        />

                                        <XAxis
                                            dataKey="className"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: '#111827',
                                                fontSize: 14,
                                            }}
                                            dy={8}
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: '#111827',
                                                fontSize: 14,
                                            }}
                                            width={42}
                                        />

                                        <Tooltip
                                            cursor={{
                                                fill: 'rgba(248,250,252,0.7)',
                                            }}
                                            content={<AttendanceTooltip />}
                                        />

                                        <Bar
                                            dataKey="present"
                                            name="Present"
                                            fill="#950025"
                                            radius={[5, 5, 0, 0]}
                                            maxBarSize={30}
                                        />

                                        <Bar
                                            dataKey="absent"
                                            name="Absent"
                                            fill="#ffc7ca"
                                            radius={[5, 5, 0, 0]}
                                            maxBarSize={30}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyState
                                height="h-[330px]"
                                message="No attendance records available."
                            />
                        )}
                    </section>

                    {/* ====================================================
                        TODAY'S CLASSES
                    ==================================================== */}

                    <section className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-7 py-5 sm:px-8">
                            <h2 className="text-[23px] font-bold">
                                Today&apos;s Classes
                            </h2>

                            <p className="mt-1 text-[15px] text-black">
                                Click a class to view the roster, or share a
                                registration link
                            </p>
                        </div>

                        {todayClasses.length > 0 ? (
                            todayClasses.map((classItem) => (
                                <TodayClassRow
                                    key={classItem.id}
                                    classItem={classItem}
                                    onShare={() => setShareClass(classItem)}
                                />
                            ))
                        ) : (
                            <EmptyState
                                height="h-[180px]"
                                message="No classes scheduled for today."
                            />
                        )}
                    </section>
                </div>
            </main>

            {/* ====================================================
                SHARE REGISTRATION MODAL
            ==================================================== */}

            {shareClass && (
                <ShareRegistrationModal
                    classItem={shareClass}
                    onClose={() => setShareClass(null)}
                />
            )}
        </>
    );
}

/*
|--------------------------------------------------------------------------
| Stat Card
|--------------------------------------------------------------------------
*/

function StatCard({
    title,
    value,
    footer,
    icon,
    iconClass,
    footerClass,
}: {
    title: string;

    value: string | number;

    footer: string;

    icon: ReactNode;

    iconClass: string;

    footerClass: string;
}) {
    return (
        <article className="min-h-[150px] rounded-[20px] border border-gray-200 bg-white px-6 py-6 shadow-sm">
            <div className="flex h-full items-start justify-between gap-5">
                <div>
                    <p className="text-[14px] font-semibold text-black uppercase">
                        {title}
                    </p>

                    <p className="mt-2 text-[36px] leading-none font-bold">
                        {value}
                    </p>

                    <p
                        className={`mt-4 text-[14px] font-medium ${footerClass}`}
                    >
                        {footer}
                    </p>
                </div>

                <div
                    className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[18px] ${iconClass}`}
                >
                    {icon}
                </div>
            </div>
        </article>
    );
}

/*
|--------------------------------------------------------------------------
| Today's Class Row
|--------------------------------------------------------------------------
*/

function TodayClassRow({
    classItem,
    onShare,
}: {
    classItem: TodayClass;

    onShare: () => void;
}) {
    /*
    |--------------------------------------------------------------------------
    | Open roster
    |--------------------------------------------------------------------------
    */

    const openClass = () => {
        router.get(`/classes/${classItem.id}`);
    };

    return (
        <div className="group grid w-full grid-cols-1 gap-5 border-b border-gray-200 px-7 py-6 text-left transition last:border-b-0 hover:bg-gray-50 sm:grid-cols-[4px_1fr_auto_auto_24px] sm:items-center sm:px-8">
            {/* LEFT BAR */}

            <span className="hidden h-[60px] w-[4px] rounded-full bg-[#b23a60] sm:block" />

            {/* CLASS INFORMATION */}

            <button
                type="button"
                onClick={openClass}
                className="min-w-0 text-left"
            >
                <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-[19px] font-semibold text-black">
                        {classItem.className}
                    </h3>

                    <ClassStatusBadge status={classItem.status} />
                </div>

                {classItem.section && (
                    <p className="mt-1 text-[14px] font-medium text-black">
                        Section: {classItem.section}
                    </p>
                )}

                <div className="mt-2 flex flex-col gap-2 text-[14px] font-medium text-black sm:flex-row sm:flex-wrap sm:gap-x-5">
                    <span className="flex items-center gap-1.5">
                        <Clock3 size={16} />
                        {classItem.startTime || '--:--'} –{' '}
                        {classItem.endTime || '--:--'}
                    </span>

                    <span className="flex items-center gap-1.5">
                        <MapPin size={16} />

                        {classItem.location || 'No location'}
                    </span>
                </div>
            </button>

            {/* PRESENT COUNT */}

            <div className="min-w-[85px]">
                <div className="flex items-center gap-1.5 sm:justify-center">
                    <UserRound size={18} className="text-[#920025]" />

                    <span className="text-[17px] font-bold">
                        {classItem.presentCount}/{classItem.studentCount}
                    </span>
                </div>

                <p className="text-[12px] text-black sm:text-center">present</p>
            </div>

            {/* SHARE BUTTON */}

            <button
                type="button"
                onClick={(event) => {
                    event.preventDefault();

                    event.stopPropagation();

                    onShare();
                }}
                className="flex w-fit items-center justify-center gap-2 rounded-full border border-[#efc5cf] px-5 py-2.5 text-[14px] font-medium text-[#920025] transition hover:border-[#d89aaa] hover:bg-[#fff1f4]"
            >
                <Share2 size={17} />
                Share Link
            </button>

            {/* OPEN CLASS ARROW */}

            <button
                type="button"
                onClick={openClass}
                aria-label="Open class roster"
                className="hidden items-center justify-center sm:flex"
            >
                <ChevronRight
                    size={21}
                    className="text-[#920025] transition-transform group-hover:translate-x-1"
                />
            </button>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Share Registration Modal
|--------------------------------------------------------------------------
*/

function ShareRegistrationModal({
    classItem,
    onClose,
}: {
    classItem: TodayClass;

    onClose: () => void;
}) {
    const [copied, setCopied] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | Copy registration URL
    |--------------------------------------------------------------------------
    */

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(classItem.registrationUrl);

            setCopied(true);

            window.setTimeout(() => {
                setCopied(false);
            }, 1800);
        } catch {
            /*
             * Fallback for browsers
             * where navigator.clipboard
             * is unavailable.
             */

            const textarea = document.createElement('textarea');

            textarea.value = classItem.registrationUrl;

            textarea.style.position = 'fixed';

            textarea.style.left = '-9999px';

            document.body.appendChild(textarea);

            textarea.focus();

            textarea.select();

            document.execCommand('copy');

            textarea.remove();

            setCopied(true);

            window.setTimeout(() => {
                setCopied(false);
            }, 1800);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-[2px]"
            onMouseDown={onClose}
        >
            <div
                className="max-h-[92vh] w-full max-w-[640px] overflow-y-auto rounded-[28px] bg-white shadow-2xl"
                onMouseDown={(event) => {
                    event.stopPropagation();
                }}
            >
                {/* ====================================================
                    MODAL HEADER
                ==================================================== */}

                <div className="rounded-t-[28px] bg-[#9b0029] px-6 py-6 text-white sm:px-8">
                    <div className="flex items-start justify-between gap-5">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                                    <Share2 size={20} />
                                </div>

                                <h2 className="text-[21px] font-bold sm:text-[22px]">
                                    Share Registration Link
                                </h2>
                            </div>

                            <p className="mt-2 text-sm break-words text-white/80">
                                {classItem.className}

                                {classItem.section
                                    ? ` · Section ${classItem.section}`
                                    : ''}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close share registration modal"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* TAB LOOK */}

                    <div className="mt-5 rounded-full bg-white/10 p-1">
                        <div className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#9b0029]">
                            <Link2 size={16} />
                            Copy Link / QR
                        </div>
                    </div>
                </div>

                {/* ====================================================
                    MODAL BODY
                ==================================================== */}

                <div className="space-y-7 px-6 py-7 sm:px-8">
                    {/* REGISTRATION LINK */}

                    <section>
                        <p className="mb-2 text-sm font-medium tracking-wide text-gray-500 uppercase">
                            Registration Link
                        </p>

                        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                            <Link2
                                size={18}
                                className="shrink-0 text-[#9b0029]"
                            />

                            <p
                                className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800"
                                title={classItem.registrationUrl}
                            >
                                {classItem.registrationUrl}
                            </p>

                            <button
                                type="button"
                                onClick={copyLink}
                                className="flex shrink-0 items-center gap-2 rounded-xl bg-[#9b0029] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#800022]"
                            >
                                {copied ? (
                                    <Check size={16} />
                                ) : (
                                    <Copy size={16} />
                                )}

                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-gray-500">
                            Students who open this link can register for{' '}
                            <span className="font-medium text-gray-700">
                                {classItem.className}
                            </span>
                            . Only registered students will have this class
                            linked to their account.
                        </p>
                    </section>

                    {/* QR CODE */}

                    <section>
                        <p className="mb-4 text-sm font-medium tracking-wide text-gray-500 uppercase">
                            QR Code
                        </p>

                        <div className="grid gap-6 sm:grid-cols-[190px_1fr] sm:items-center">
                            {/* QR */}

                            <div className="flex min-h-[190px] items-center justify-center rounded-2xl border border-[#efd6dc] bg-white p-4 shadow-sm">
                                {classItem.registrationUrl ? (
                                    <QRCodeSVG
                                        value={classItem.registrationUrl}
                                        size={155}
                                        level="M"
                                        fgColor="#980028"
                                        bgColor="#ffffff"
                                    />
                                ) : (
                                    <div className="text-center text-sm text-gray-500">
                                        Registration link is unavailable.
                                    </div>
                                )}
                            </div>

                            {/* CLASS DETAILS */}

                            <div className="min-w-0">
                                <h3 className="text-lg font-bold break-words text-black">
                                    {classItem.className}
                                </h3>

                                {classItem.section && (
                                    <p className="mt-2 text-sm text-gray-600">
                                        Section:{' '}
                                        <span className="font-semibold text-black">
                                            {classItem.section}
                                        </span>
                                    </p>
                                )}

                                <p className="mt-2 text-sm text-gray-600">
                                    Time:{' '}
                                    <span className="font-semibold text-black">
                                        {classItem.startTime} –{' '}
                                        {classItem.endTime}
                                    </span>
                                </p>

                                <p className="mt-2 text-sm break-words text-gray-600">
                                    Room:{' '}
                                    <span className="font-semibold text-black">
                                        {classItem.location || 'No location'}
                                    </span>
                                </p>

                                <p className="mt-4 text-sm leading-6 text-gray-500">
                                    Display or print this QR code. Students can
                                    scan it to open the registration page.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* BOTTOM COPY BUTTON FOR MOBILE */}

                    <button
                        type="button"
                        onClick={copyLink}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e7bac5] bg-[#fff7f9] px-5 py-3 font-semibold text-[#920025] transition hover:bg-[#ffedf1] sm:hidden"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}

                        {copied ? 'Link Copied' : 'Copy Registration Link'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

function ClassStatusBadge({ status }: { status: string }) {
    let classes = 'border-[#f0bec8] bg-[#fff4f6] text-[#9b0028]';

    if (status === 'Done') {
        classes = 'border-gray-200 bg-gray-50 text-gray-700';
    }

    if (status === 'Ongoing') {
        classes = 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    return (
        <span
            className={`rounded-full border px-3 py-1 text-[11px] font-medium ${classes}`}
        >
            {status}
        </span>
    );
}

/*
|--------------------------------------------------------------------------
| Tooltip
|--------------------------------------------------------------------------
*/

function AttendanceTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;

    payload?: Array<{
        dataKey?: string;

        value?: number;
    }>;

    label?: string;
}) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const present =
        payload.find((item) => item.dataKey === 'present')?.value ?? 0;

    const absent =
        payload.find((item) => item.dataKey === 'absent')?.value ?? 0;

    return (
        <div className="rounded-[14px] border border-gray-100 bg-white px-4 py-3 shadow-lg">
            <p className="mb-2 text-[15px] font-medium text-gray-700">
                {label}
            </p>

            <p className="text-[15px] font-medium text-[#950025]">
                Present: {present}
            </p>

            <p className="mt-1 text-[15px] font-medium text-[#f4a8ad]">
                Absent: {absent}
            </p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatPercentage(value: number): string {
    if (Number.isInteger(value)) {
        return value.toString();
    }

    return value.toFixed(1);
}

function EmptyState({
    message,
    height,
}: {
    message: string;

    height: string;
}) {
    return (
        <div className={`flex items-center justify-center ${height}`}>
            <p className="text-gray-500">{message}</p>
        </div>
    );
}
