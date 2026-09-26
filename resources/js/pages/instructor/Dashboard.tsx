import { Head, router, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    BookOpen,
    CalendarDays,
    ChevronRight,
    Clock3,
    MapPin,
    TrendingUp,
    UserRound,
    Users,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type ClassAttendance = {
    className: string;
    present: number;
    absent: number;
};

type InstructorStats = {
    myClasses: number;
    totalStudents: number;
    averageAttendance: number;
    attendanceChange?: number;
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
    presentCount?: number;
    status: string;
};

type PageProps = {
    instructorStats?: InstructorStats;
    classAttendance?: ClassAttendance[];
    todayClasses?: TodayClass[];
};

export default function Dashboard() {
    const {
        instructorStats = {
            myClasses: 0,
            totalStudents: 0,
            averageAttendance: 0,
            attendanceChange: 0,
            classesToday: 0,
        },
        classAttendance = [],
        todayClasses = [],
    } = usePage().props as PageProps;

    const attendanceFooter =
        instructorStats.attendanceChange !== undefined &&
        instructorStats.attendanceChange !== 0
            ? `${instructorStats.attendanceChange > 0 ? '+' : ''}${
                  instructorStats.attendanceChange
              }%`
            : 'No records yet';

    return (
        <>
            <Head title="My Classes" />

            <main className="min-h-screen bg-[#f6f7f9] px-5 py-7 text-slate-950 sm:px-7 lg:px-8">
                <section className="mb-7">
                    <h1 className="text-3xl font-bold tracking-tight text-[#8f001f]">
                        My Classes Overview
                    </h1>

                    <p className="mt-1 text-base text-black">
                        Track attendance for your classes
                    </p>
                </section>

                <section className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="My Classes"
                        value={instructorStats.myClasses.toString()}
                        footer="Active"
                        icon={<BookOpen size={28} />}
                        iconBg="bg-[#991b1f]"
                    />

                    <StatCard
                        title="Total Students"
                        value={instructorStats.totalStudents.toString()}
                        footer="Enrolled"
                        icon={<Users size={29} />}
                        iconBg="bg-[#b80016]"
                    />

                    <StatCard
                        title="Avg. Attendance"
                        value={`${instructorStats.averageAttendance}%`}
                        footer={attendanceFooter}
                        icon={<TrendingUp size={29} />}
                        iconBg="bg-[#00a83e]"
                    />

                    <StatCard
                        title="Classes Today"
                        value={instructorStats.classesToday.toString()}
                        footer="Scheduled"
                        icon={<CalendarDays size={28} />}
                        iconBg="bg-[#ed7600]"
                    />
                </section>

                <section className="mb-7 rounded-2xl border border-slate-200 bg-white px-5 py-7 shadow-sm sm:px-7">
                    <h2 className="mb-6 text-2xl font-semibold">
                        Class Attendance Overview
                    </h2>

                    {classAttendance.length > 0 ? (
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={classAttendance}
                                    margin={{
                                        top: 5,
                                        right: 15,
                                        left: 0,
                                        bottom: 10,
                                    }}
                                    barGap={4}
                                >
                                    <CartesianGrid
                                        stroke="#d1d5db"
                                        strokeDasharray="4 4"
                                    />

                                    <XAxis
                                        dataKey="className"
                                        tick={{
                                            fill: '#475569',
                                            fontSize: 13,
                                        }}
                                        tickLine={false}
                                    />

                                    <YAxis
                                        allowDecimals={false}
                                        tick={{
                                            fill: '#475569',
                                            fontSize: 13,
                                        }}
                                        tickLine={false}
                                    />

                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{
                                            borderRadius: '10px',
                                            border: '1px solid #e2e8f0',
                                        }}
                                    />

                                    <Legend />

                                    <Bar
                                        dataKey="present"
                                        name="Present"
                                        fill="#10b981"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={86}
                                    />

                                    <Bar
                                        dataKey="absent"
                                        name="Absent"
                                        fill="#f5bcbc"
                                        stroke="#ef9a9a"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={86}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyState
                            height="h-[350px]"
                            message="No attendance data yet."
                        />
                    )}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-6 sm:px-8">
                        <h2 className="text-2xl font-bold">
                            Today&apos;s Classes
                        </h2>

                        <p className="mt-1 text-sm text-slate-700">
                            Click a class to view section and student roster
                        </p>
                    </div>

                    {todayClasses.length > 0 ? (
                        todayClasses.map((classItem) => (
                            <TodayClassRow
                                key={classItem.id}
                                classItem={classItem}
                            />
                        ))
                    ) : (
                        <EmptyState
                            height="h-[180px]"
                            message="No classes scheduled for today."
                        />
                    )}
                </section>
            </main>
        </>
    );
}

function StatCard({
    title,
    value,
    footer,
    icon,
    iconBg,
}: {
    title: string;
    value: string;
    footer: string;
    icon: ReactNode;
    iconBg: string;
}) {
    return (
        <article className="min-h-[188px] rounded-2xl border border-slate-200 bg-white px-7 py-7 shadow-sm">
            <div className="flex h-full items-center justify-between gap-5">
                <div>
                    <p className="max-w-[130px] text-lg leading-6 text-slate-600">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-semibold">
                        {value}
                    </p>

                    <p className="mt-4 text-base text-slate-500">
                        {footer}
                    </p>
                </div>

                <div
                    className={`flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl text-white ${iconBg}`}
                >
                    {icon}
                </div>
            </div>
        </article>
    );
}

function TodayClassRow({
    classItem,
}: {
    classItem: TodayClass;
}) {
    const presentCount = classItem.presentCount ?? 0;

    const openClass = () => {
        router.get(`/classes/${classItem.id}`);
    };

    return (
        <button
            type="button"
            onClick={openClass}
            className="group grid w-full grid-cols-1 gap-5 border-b border-slate-200 px-5 py-6 text-left transition-colors last:border-b-0 hover:bg-slate-50 sm:grid-cols-[5px_1fr_auto_24px] sm:items-center sm:px-8"
        >
            <span className="hidden h-[62px] w-[5px] rounded-full bg-[#b23a60] sm:block" />

            <div>
                <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold">
                        {classItem.className}
                    </h3>

                    <ClassStatusBadge
                        status={classItem.status}
                    />
                </div>

                {classItem.section && (
                    <p className="mt-1 font-semibold">
                        Section: {classItem.section}
                    </p>
                )}

                <div className="mt-1 flex flex-col gap-1 text-sm sm:flex-row sm:gap-5">
                    <span className="flex items-center gap-1.5">
                        <Clock3 size={16} />
                        {formatTime(classItem.startTime)} –{' '}
                        {formatTime(classItem.endTime)}
                    </span>

                    <span className="flex items-center gap-1.5">
                        <MapPin size={16} />
                        {classItem.location}
                    </span>
                </div>
            </div>

            <div className="min-w-[85px] sm:text-center">
                <div className="flex items-center gap-1.5 sm:justify-center">
                    <UserRound
                        size={18}
                        className="text-[#8f001f]"
                    />

                    <span className="text-lg font-bold">
                        {presentCount}/{classItem.studentCount}
                    </span>
                </div>

                <p className="text-sm">present</p>
            </div>

            <ChevronRight
                size={22}
                className="hidden text-slate-400 transition-transform group-hover:translate-x-1 sm:block"
            />
        </button>
    );
}

function ClassStatusBadge({
    status,
}: {
    status: string;
}) {
    let classes =
        'border-red-200 bg-red-50 text-red-700';

    if (status === 'Done') {
        classes =
            'border-slate-200 bg-slate-100 text-slate-950';
    } else if (status === 'Ongoing') {
        classes =
            'border-blue-200 bg-blue-50 text-blue-700';
    }

    return (
        <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${classes}`}
        >
            {status}
        </span>
    );
}

function formatTime(value?: string) {
    if (!value) {
        return '--:--';
    }

    const [hourValue, minuteValue] = value
        .slice(0, 5)
        .split(':')
        .map(Number);

    if (
        Number.isNaN(hourValue) ||
        Number.isNaN(minuteValue)
    ) {
        return value;
    }

    const period = hourValue >= 12 ? 'PM' : 'AM';
    const hour = hourValue % 12 || 12;

    return `${hour.toString().padStart(2, '0')}:${minuteValue
        .toString()
        .padStart(2, '0')} ${period}`;
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
            <p className="text-slate-500">{message}</p>
        </div>
    );
}