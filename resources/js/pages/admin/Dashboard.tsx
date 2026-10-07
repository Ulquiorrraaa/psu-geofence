import { Head, usePage } from '@inertiajs/react';
import { ShieldCheck, TrendingUp, UserCheck, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface Stats {
    totalStudents: number;
    presentToday: number;
    totalInstructors: number;
    totalGuards: number;
    totalClasses: number;
    activeClasses: number;
    registeredStudents: number;
    lateToday: number;
    absentToday: number;
    presentRecordsToday: number;
    attendanceRateToday: number | null;
}

interface WeeklyAttendance {
    day: string;
    present: number;
    absent: number;
    onTime: number;
    late: number;
}

interface StudentTraffic {
    time: string;
    students: number;
}

interface RecentActivity {
    name: string;
    className: string;
    status: string;
    time: string;
}

interface PageProps {
    [key: string]: unknown;
    stats: Stats;
    studentsPerCourse: { label: string; count: number }[];
    studentsPerYear: { label: string; count: number }[];
    todayOverview: { label: string; count: number }[];
    weeklyAttendance: WeeklyAttendance[];
    studentTraffic: StudentTraffic[];
    recentActivities: RecentActivity[];
}

export default function Dashboard() {
    const {
        stats,
        studentsPerCourse,
        studentsPerYear,
        todayOverview,
        weeklyAttendance = [],
        studentTraffic = [],
        recentActivities = [],
    } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Dashboard" />

            <div className="min-h-full bg-[#f7f8fa] p-5 text-gray-900 sm:p-7 lg:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-[#8f001f]">
                        System Dashboard
                    </h1>

                    <p className="mt-1 text-base text-gray-600">
                        Complete overview across all platforms - Students,
                        Instructors, and Guards
                    </p>
                </div>

                <div className="mb-8 grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Total Students"
                        value={stats.totalStudents.toString()}
                        sub=""
                        footer="Enrolled"
                        icon={<Users />}
                        color="bg-[#8C0710]"
                    />

                    <StatCard
                        title="Present Today"
                        value={String(stats.presentRecordsToday)}
                        sub={
                            stats.attendanceRateToday === null
                                ? 'No records yet'
                                : stats.attendanceRateToday + '%'
                        }
                        footer="Attendance Rate"
                        icon={<TrendingUp />}
                        color="bg-green-500"
                    />

                    <StatCard
                        title="Total Instructors"
                        value={stats.totalInstructors.toString()}
                        sub=""
                        footer="Teaching Faculty"
                        icon={<UserCheck />}
                        color="bg-[#B1121B]"
                    />

                    <StatCard
                        title="Security Guards"
                        value={stats.totalGuards.toString()}
                        sub=""
                        footer="Campus Security"
                        icon={<ShieldCheck />}
                        color="bg-orange-500"
                    />
                </div>

                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        ['Total Classes', stats.totalClasses],
                        ['Active Classes', stats.activeClasses],
                        ['Registered Students', stats.registeredStudents],
                        ['Late Today', stats.lateToday],
                        ['Absent Today', stats.absentToday],
                        [
                            'Attendance Rate Today',
                            stats.attendanceRateToday === null
                                ? 'No records yet'
                                : stats.attendanceRateToday + '%',
                        ],
                    ].map(([label, value]) => (
                        <div
                            key={String(label)}
                            className="rounded-xl border bg-white p-5 shadow-sm"
                        >
                            <p className="text-gray-600">{label}</p>
                            <p className="mt-2 text-3xl font-bold text-[#850027]">
                                {value}
                            </p>
                        </div>
                    ))}
                </div>
                <p className="mb-6 text-sm text-gray-500">
                    Today’s status counts are class attendance records. Rate =
                    (Present + Late) / recorded attendance. Pending or missing
                    attendance is not counted as absent. Active classes are
                    Scheduled or Ongoing. Registered students have
                    student-information registration records.
                </p>
                <div className="mb-8 grid gap-5 lg:grid-cols-3">
                    {[
                        ['Attendance Today', todayOverview],
                        ['Students per Course', studentsPerCourse],
                        ['Students per Year Level', studentsPerYear],
                    ].map(([title, data]) => (
                        <div
                            key={String(title)}
                            className="rounded-xl border bg-white p-5 shadow-sm"
                        >
                            <h2 className="mb-4 text-lg font-bold">
                                {String(title)}
                            </h2>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={
                                            data as {
                                                label: string;
                                                count: number;
                                            }[]
                                        }
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="label" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#850027" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mb-8 grid gap-7 lg:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-6 text-xl font-bold text-gray-950">
                            Weekly Attendance
                        </h2>

                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyAttendance}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar
                                        dataKey="onTime"
                                        name="Present"
                                        fill="#10b981"
                                    />
                                    <Bar
                                        dataKey="late"
                                        name="Late"
                                        fill="#f59e0b"
                                    />
                                    <Bar dataKey="absent" fill="#ff2d3d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-6 text-xl font-bold text-gray-950">
                            Student Traffic Today
                        </h2>

                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={studentTraffic}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip content={<TrafficTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="students"
                                        stroke="#8b2f17"
                                        strokeWidth={4}
                                        dot={{
                                            r: 5,
                                            fill: 'white',
                                            stroke: '#8b2f17',
                                            strokeWidth: 3,
                                        }}
                                        activeDot={{
                                            r: 7,
                                            fill: 'white',
                                            stroke: '#8b2f17',
                                            strokeWidth: 3,
                                        }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b p-6">
                        <h2 className="text-2xl font-bold text-gray-950">
                            Recent Activity
                        </h2>
                    </div>

                    {recentActivities.length > 0 ? (
                        recentActivities.map((activity, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between border-b p-6 last:border-b-0"
                            >
                                <div>
                                    <h3 className="text-lg font-bold text-gray-950">
                                        {activity.name}
                                    </h3>

                                    <p className="text-gray-700">
                                        {activity.className}
                                    </p>
                                </div>

                                <div className="flex items-center gap-16">
                                    <span
                                        className={`rounded-full px-4 py-2 text-sm font-bold ${
                                            activity.status === 'Present'
                                                ? 'bg-green-100 text-green-700'
                                                : activity.status === 'Absent'
                                                  ? 'bg-red-100 text-red-700'
                                                  : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {activity.status}
                                    </span>

                                    <span className="w-32 text-gray-600">
                                        {activity.time}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-gray-500">
                            No recent activity yet.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function TrafficTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-white p-4 shadow-md">
                <p className="mb-2 text-lg font-semibold text-gray-950">
                    {label}
                </p>

                <p className="text-[#8b2f17]">
                    students : {payload[0]?.value ?? 0}
                </p>
            </div>
        );
    }

    return null;
}

function StatCard({
    title,
    value,
    sub,
    footer,
    icon,
    color,
}: {
    title: string;
    value: string;
    sub: string;
    footer: string;
    icon: ReactNode;
    color: string;
}) {
    return (
        <div className="flex min-h-[170px] items-center justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
                <p className="text-lg text-gray-700">{title}</p>

                <h2 className="mt-3 text-3xl font-bold text-gray-950">
                    {value}
                </h2>

                <p className="mt-2 text-gray-600">{sub}</p>

                <p className="text-sm text-gray-500">{footer}</p>
            </div>

            <div className={`rounded-xl p-4 text-white ${color}`}>{icon}</div>
        </div>
    );
}
