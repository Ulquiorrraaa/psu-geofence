import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { BookOpen, Calendar, TrendingUp, Users } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
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
    classesToday: number;
};

type PageProps = {
    instructorStats?: InstructorStats;
    classAttendance?: ClassAttendance[];
};

export default function MyClasses() {
    const {
        instructorStats = {
            myClasses: 0,
            totalStudents: 0,
            averageAttendance: 0,
            classesToday: 0,
        },
        classAttendance = [],
    } = usePage().props as PageProps;

    return (
        <>
            <Head title="My Classes" />

            <div className="min-h-screen bg-[#7b0000] p-6 text-white">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold">
                        My Classes Overview
                    </h1>

                    <p className="text-xl text-red-100">
                        Track attendance for your classes
                    </p>
                </div>

                <div className="mb-8 grid gap-6 md:grid-cols-4">
                    <StatCard
                        title="My Classes"
                        value={instructorStats.myClasses.toString()}
                        footer="Active"
                        icon={<BookOpen />}
                        iconBg="bg-red-800"
                    />

                    <StatCard
                        title="Total Students"
                        value={instructorStats.totalStudents.toString()}
                        footer="Enrolled"
                        icon={<Users />}
                        iconBg="bg-red-700"
                    />

                    <StatCard
                        title="Avg. Attendance"
                        value={`${instructorStats.averageAttendance}%`}
                        footer="Attendance Rate"
                        icon={<TrendingUp />}
                        iconBg="bg-green-600"
                    />

                    <StatCard
                        title="Classes Today"
                        value={instructorStats.classesToday.toString()}
                        footer="Scheduled"
                        icon={<Calendar />}
                        iconBg="bg-orange-500"
                    />
                </div>

                <div className="rounded-2xl bg-white p-8 text-gray-900 shadow-lg">
                    <h2 className="mb-8 text-3xl font-bold">
                        Class Attendance Overview
                    </h2>

                    {classAttendance.length > 0 ? (
                        <div className="h-[450px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={classAttendance}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="className" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="present" fill="#10b981" />
                                    <Bar dataKey="absent" fill="#ef4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex h-[450px] items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-xl text-gray-500">
                            No class attendance data yet.
                        </div>
                    )}
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
    iconBg,
}: {
    title: string;
    value: string;
    footer: string;
    icon: ReactNode;
    iconBg: string;
}) {
    return (
        <div className="rounded-2xl bg-white p-8 text-gray-900 shadow-lg">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xl text-gray-600">{title}</p>
                    <h2 className="mt-3 text-5xl font-bold">{value}</h2>
                    <p className="mt-3 text-lg text-gray-500">{footer}</p>
                </div>

                <div className={`rounded-2xl p-5 text-white ${iconBg}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}