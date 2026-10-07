import { Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CalendarDays,
    ChevronRight,
    Clock3,
    MapPin,
    Share2,
    TrendingUp,
    Users,
} from 'lucide-react';
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

type InstructorStats = {
    myClasses: number;
    totalStudents: number;
    averageAttendance: number;
    classesToday: number;
};

type ClassAttendance = {
    className: string;
    present: number;
    absent: number;
};

type TodayClass = {
    id: number;
    classCode: string;
    className: string;
    section: string;
    startTime: string;
    endTime: string;
    location: string;
    present: number;
    totalStudents: number;
    status: 'Done' | 'Upcoming' | 'Ongoing';
    url?: string;
    registrationUrl?: string;
};

type PageProps = {
    instructorStats: InstructorStats;
    classAttendance: ClassAttendance[];
    todayClasses: TodayClass[];
};

export default function MyClasses() {
    const { instructorStats, classAttendance, todayClasses } =
        usePage<PageProps>().props;

    return (
        <>
            <Head title="My Classes" />

            <div className="min-h-full bg-[#f7f8fa] px-5 py-7 sm:px-7 lg:px-8">
                <div className="w-full min-w-0">
                    <div className="mb-7">
                        <h1 className="text-3xl font-bold text-[#920025]">
                            My Classes Overview
                        </h1>

                        <p className="mt-1 text-base text-gray-700">
                            Track attendance and share registration links
                        </p>
                    </div>

                    <div className="mb-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="MY CLASSES"
                            value={instructorStats.myClasses}
                            footer="Active"
                            icon={<BookOpen size={26} />}
                            iconClass="bg-[#fff0f3] text-[#990025]"
                        />

                        <StatCard
                            title="TOTAL STUDENTS"
                            value={instructorStats.totalStudents}
                            footer="Enrolled"
                            icon={<Users size={27} />}
                            iconClass="bg-blue-50 text-blue-600"
                        />

                        <StatCard
                            title="AVG. ATTENDANCE"
                            value={`${instructorStats.averageAttendance}%`}
                            footer="Attendance Rate"
                            icon={<TrendingUp size={27} />}
                            iconClass="bg-green-50 text-green-600"
                        />

                        <StatCard
                            title="CLASSES TODAY"
                            value={instructorStats.classesToday}
                            footer="Scheduled"
                            icon={<CalendarDays size={27} />}
                            iconClass="bg-orange-50 text-orange-500"
                        />
                    </div>

                    <div className="mb-7 rounded-[20px] border border-gray-200 bg-white p-7 shadow-sm">
                        <h2 className="text-2xl font-bold">
                            Class Attendance Overview
                        </h2>

                        <p className="mt-1 text-sm text-gray-600">
                            Present vs. absent across all classes
                        </p>

                        {classAttendance.length > 0 ? (
                            <div className="mt-6 h-[360px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={classAttendance}>
                                        <CartesianGrid
                                            vertical={false}
                                            strokeDasharray="4 4"
                                        />

                                        <XAxis
                                            dataKey="className"
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <Tooltip />

                                        <Bar
                                            dataKey="present"
                                            fill="#950025"
                                            radius={[5, 5, 0, 0]}
                                        />

                                        <Bar
                                            dataKey="absent"
                                            fill="#ffc9cb"
                                            radius={[5, 5, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="mt-6 flex h-[300px] items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-500">
                                No attendance records available.
                            </div>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm">
                        <div className="border-b px-7 py-5">
                            <h2 className="text-2xl font-bold">
                                Today's Classes
                            </h2>

                            <p className="mt-1 text-sm text-gray-600">
                                Click a class to view the roster, or share a
                                registration link
                            </p>
                        </div>

                        {todayClasses.length > 0 ? (
                            todayClasses.map((classItem, index) => (
                                <ClassRow
                                    key={classItem.id}
                                    classItem={classItem}
                                    last={index === todayClasses.length - 1}
                                />
                            ))
                        ) : (
                            <div className="px-7 py-12 text-center text-gray-500">
                                No classes scheduled today.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function StatCard({
    title,
    value,
    footer,
    icon,
    iconClass,
}: {
    title: string;
    value: string | number;
    footer: string;
    icon: ReactNode;
    iconClass: string;
}) {
    return (
        <div className="rounded-[20px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-gray-800">
                        {title}
                    </p>

                    <p className="mt-2 text-4xl font-bold text-black">
                        {value}
                    </p>

                    <p className="mt-3 text-sm text-gray-500">{footer}</p>
                </div>

                <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconClass}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

function ClassRow({
    classItem,
    last,
}: {
    classItem: TodayClass;
    last: boolean;
}) {
    const row = (
        <div
            className={`grid gap-5 px-7 py-6 transition hover:bg-gray-50 lg:grid-cols-[1fr_auto] lg:items-center ${
                !last ? 'border-b' : ''
            }`}
        >
            <div className="flex gap-5">
                <div className="w-1 rounded-full bg-[#a72a4d]" />

                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold">
                            {classItem.classCode} — {classItem.className}
                        </h3>

                        <span
                            className={`rounded-full border px-3 py-1 text-xs ${
                                classItem.status === 'Done'
                                    ? 'bg-gray-50 text-gray-700'
                                    : classItem.status === 'Ongoing'
                                      ? 'border-green-200 bg-green-50 text-green-700'
                                      : 'border-red-200 bg-red-50 text-[#990025]'
                            }`}
                        >
                            {classItem.status}
                        </span>
                    </div>

                    <p className="mt-1 text-sm">Section: {classItem.section}</p>

                    <div className="mt-2 flex flex-wrap gap-5 text-sm">
                        <div className="flex items-center gap-2">
                            <Clock3 size={16} />

                            <span>
                                {classItem.startTime} – {classItem.endTime}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <MapPin size={16} />

                            <span>{classItem.location}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="text-center">
                    <div className="flex items-center gap-2">
                        <Users size={17} className="text-[#990025]" />

                        <span className="font-bold">
                            {classItem.present}/{classItem.totalStudents}
                        </span>
                    </div>

                    <p className="text-xs">present</p>
                </div>

                {classItem.registrationUrl && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            navigator.clipboard.writeText(
                                classItem.registrationUrl!,
                            );
                        }}
                        className="flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm text-[#920025] hover:bg-red-50"
                    >
                        <Share2 size={16} />
                        Share Link
                    </button>
                )}

                <ChevronRight size={20} className="text-[#920025]" />
            </div>
        </div>
    );

    if (classItem.url) {
        return (
            <Link href={classItem.url} className="block">
                {row}
            </Link>
        );
    }

    return row;
}
