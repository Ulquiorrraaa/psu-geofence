import { Head, usePage } from '@inertiajs/react';
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
import { ShieldCheck, TrendingUp, UserCheck, Users } from 'lucide-react';

interface Stats {
    totalStudents: number;
    totalInstructors: number;
    totalGuards: number;
}

interface WeeklyAttendance {
    day: string;
    present: number;
    absent: number;
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
    weeklyAttendance: WeeklyAttendance[];
    studentTraffic: StudentTraffic[];
    recentActivities: RecentActivity[];
}

export default function Dashboard() {
    const {
        stats,
        weeklyAttendance = [],
        studentTraffic = [],
        recentActivities = [],
    } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Dashboard" />

            <div className="min-h-screen bg-[#650006] p-8 text-white">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">
                        System Dashboard
                    </h1>

                    <p className="text-lg text-white/90">
                        Complete overview across all platforms - Students,
                        Instructors, and Guards
                    </p>
                </div>

                <div className="mb-8 grid gap-7 md:grid-cols-4">
                    <StatCard
                        title="Total Students"
                        value={stats.totalStudents.toString()}
                        sub="+12%"
                        footer="Enrolled"
                        icon={<Users />}
                        color="bg-[#8C0710]"
                    />

                    <StatCard
                        title="Present Today"
                        value="0"
                        sub="0%"
                        footer="Attendance Rate"
                        icon={<TrendingUp />}
                        color="bg-green-500"
                    />

                    <StatCard
                        title="Active Instructors"
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

                <div className="mb-8 grid gap-7 lg:grid-cols-2">
                    <div className="rounded-xl bg-white p-7 shadow-lg">
                        <h2 className="mb-6 text-2xl font-bold text-gray-950">
                            Weekly Attendance
                        </h2>

                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyAttendance}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip content={<WeeklyTooltip />} />
                                    <Bar dataKey="present" fill="#10b981" />
                                    <Bar dataKey="absent" fill="#ff2d3d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-7 shadow-lg">
                        <h2 className="mb-6 text-2xl font-bold text-gray-950">
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

                <div className="rounded-xl bg-white shadow-lg">
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

function WeeklyTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-white p-4 shadow-md">
                <p className="mb-2 text-lg font-semibold text-gray-950">
                    {label}
                </p>

                <p className="text-emerald-600">
                    present : {payload[0]?.value ?? 0}
                </p>

                <p className="text-red-500">
                    absent : {payload[1]?.value ?? 0}
                </p>
            </div>
        );
    }

    return null;
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
        <div className="flex min-h-[190px] items-center justify-between rounded-xl bg-white p-8 shadow-lg">
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
``;
