import { Head, router, usePage } from '@inertiajs/react';
import { Calendar, Download, FileText, TrendingUp, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { csvCell } from '@/lib/csv';

type ReportType =
    | 'Attendance Summary'
    | 'Class Report'
    | 'Absent Students'
    | 'Late Students';

type DateRange = 'Today' | 'This Week' | 'This Month' | 'This Year';

type ReportStats = {
    totalRecords: number;
    averageAttendance: number;
    classesTracked: number;
    reportsGenerated: number;
};

type MonthlyTrend = {
    month: string;
    present: number;
    late: number;
    absent: number;
};

type StatusDistribution = {
    name: string;
    value: number;
};

type ClassRate = {
    className: string;
    rate: number;
    present: number;
    late: number;
    absent: number;
};

type PageProps = {
    filters: { reportType: ReportType; dateRange: DateRange };
    reportStats?: ReportStats;
    monthlyTrends?: MonthlyTrend[];
    statusDistribution?: StatusDistribution[];
    classRates?: ClassRate[];
};

export default function Reports() {
    const {
        filters,
        reportStats = {
            totalRecords: 0,
            averageAttendance: 0,
            classesTracked: 0,
            reportsGenerated: 0,
        },

        monthlyTrends = [],

        statusDistribution = [],

        classRates = [],
    } = usePage<PageProps>().props;

    const [reportType, setReportType] = useState<ReportType>(
        filters.reportType,
    );

    const [dateRange, setDateRange] = useState<DateRange>(filters.dateRange);

    const [generating, setGenerating] = useState(false);
    const reportRows = useMemo(() => {
        return classRates.map((item) => ({
            reportType: filters.reportType,
            dateRange: filters.dateRange,
            present: item.present,
            late: item.late,
            absent: item.absent,
            className: item.className,
            attendanceRate: `${item.rate}%`,
        }));
    }, [classRates, filters]);

    function generateReport() {
        if (generating) {
            return;
        }

        setGenerating(true);
        router.get(
            '/admin/reports',
            { reportType, dateRange },
            {
                preserveScroll: true,
                onFinish: () => setGenerating(false),
            },
        );
    }

    function exportCSV() {
        const headers = [
            'Report Type',
            'Date Range',
            'Class Name',
            'Attendance Rate',
            'Present',
            'Late',
            'Absent',
        ];

        const rows = reportRows.map((row) => [
            row.reportType,
            row.dateRange,
            row.className,
            row.attendanceRate,
            String(row.present),
            String(row.late),
            String(row.absent),
        ]);

        const csv = [
            headers.join(','),
            ...rows.map((row) => row.map(csvCell).join(',')),
        ].join('\n');

        const blob = new Blob([csv], {
            type: 'text/csv;charset=utf-8;',
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;
        link.download = 'attendance-report.csv';
        link.click();

        URL.revokeObjectURL(url);
    }

    function exportPDF() {
        window.print();
    }

    return (
        <>
            <Head title="Reports" />

            <div className="min-h-full bg-[#f7f8fa] p-5 text-gray-900 sm:p-7">
                {/* HEADER */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-[#8f001f]">
                        Reports
                    </h1>

                    <p className="mt-1 text-base text-gray-600">
                        Generate and download attendance reports
                    </p>
                </div>

                {/* GENERATE REPORT */}
                <div className="mb-7 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="mb-5 text-xl font-bold text-gray-950">
                        Generate Report
                    </h2>

                    <div className="grid gap-5 lg:grid-cols-3">
                        <div>
                            <label className="mb-2 block font-semibold text-gray-800">
                                Report Type
                            </label>

                            <select
                                value={reportType}
                                onChange={(e) =>
                                    setReportType(e.target.value as ReportType)
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-[#970027]"
                            >
                                <option>Attendance Summary</option>
                                <option>Class Report</option>
                                <option>Absent Students</option>
                                <option>Late Students</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block font-semibold text-gray-800">
                                Date Range
                            </label>

                            <select
                                value={dateRange}
                                onChange={(e) =>
                                    setDateRange(e.target.value as DateRange)
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-[#970027]"
                            >
                                <option>Today</option>
                                <option>This Week</option>
                                <option>This Month</option>
                                <option>This Year</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                disabled={generating}
                                onClick={generateReport}
                                className="w-full rounded-lg bg-[#970027] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#790020]"
                            >
                                Generate Report
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-4">
                        <button
                            onClick={exportPDF}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-base font-semibold text-gray-800 transition hover:bg-gray-50"
                        >
                            <Download size={20} />
                            Export as PDF
                        </button>

                        <button
                            onClick={exportCSV}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-base font-semibold text-gray-800 transition hover:bg-gray-50"
                        >
                            <Download size={20} />
                            Export as CSV
                        </button>
                    </div>
                </div>

                {/* STATS */}
                <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Total Records"
                        value={reportStats.totalRecords.toString()}
                        icon={<Users />}
                        bg="bg-red-100"
                        color="text-red-700"
                    />

                    <StatCard
                        title="Avg. Attendance"
                        value={`${reportStats.averageAttendance}%`}
                        icon={<TrendingUp />}
                        bg="bg-green-100"
                        color="text-green-700"
                    />

                    <StatCard
                        title="Classes Tracked"
                        value={reportStats.classesTracked.toString()}
                        icon={<Calendar />}
                        bg="bg-purple-100"
                        color="text-purple-700"
                    />

                    <StatCard
                        title="Recorded Students"
                        value={reportStats.reportsGenerated.toString()}
                        icon={<FileText />}
                        bg="bg-orange-100"
                        color="text-orange-700"
                    />
                </div>

                {/* CHARTS */}
                <div className="mb-8 grid gap-6 lg:grid-cols-2">
                    {/* BAR CHART */}
                    <div className="rounded-xl border bg-white p-8 shadow-sm">
                        <h2 className="mb-8 text-2xl font-bold text-gray-950">
                            Monthly Attendance Trends
                        </h2>

                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyTrends}>
                                    <CartesianGrid strokeDasharray="3 3" />

                                    <XAxis dataKey="month" />

                                    <YAxis />

                                    <Tooltip />

                                    <Bar
                                        dataKey="present"
                                        fill="#10b981"
                                        radius={[5, 5, 0, 0]}
                                    />

                                    <Bar
                                        dataKey="late"
                                        fill="#eab308"
                                        radius={[5, 5, 0, 0]}
                                    />

                                    <Bar
                                        dataKey="absent"
                                        fill="#ef4444"
                                        radius={[5, 5, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold">
                            <span className="text-emerald-600">Present</span>

                            <span className="text-yellow-600">Late</span>

                            <span className="text-red-600">Absent</span>
                        </div>
                    </div>

                    {/* PIE CHART */}
                    <div className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-6">
                        <h2 className="mb-8 text-2xl font-bold text-gray-950">
                            Attendance Status Distribution
                        </h2>

                        {statusDistribution.length > 0 ? (
                            <div className="flex min-h-[320px] flex-col items-center justify-center gap-6 2xl:flex-row">
                                {/* CHART */}
                                <div className="flex w-full min-w-0 items-center justify-center 2xl:flex-1">
                                    <div className="aspect-square w-full max-w-[350px]">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={statusDistribution}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius="75%"
                                                    paddingAngle={2}
                                                >
                                                    {statusDistribution.map(
                                                        (item) => (
                                                            <Cell
                                                                key={item.name}
                                                                fill={
                                                                    item.name ===
                                                                    'Present'
                                                                        ? '#10b981'
                                                                        : item.name ===
                                                                            'Late'
                                                                          ? '#eab308'
                                                                          : '#ef4444'
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>

                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* LEGEND */}
                                <div className="space-y-4 text-base font-bold sm:text-lg">
                                    {statusDistribution.map((item) => (
                                        <p
                                            key={item.name}
                                            className={
                                                item.name === 'Present'
                                                    ? 'text-emerald-600'
                                                    : item.name === 'Late'
                                                      ? 'text-yellow-600'
                                                      : 'text-red-600'
                                            }
                                        >
                                            {item.name}: {item.value}%
                                        </p>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-96 items-center justify-center text-gray-500">
                                No attendance distribution data yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                    <div className="border-b p-8">
                        <h2 className="text-2xl font-bold text-gray-950">
                            Class Attendance Rates
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-sm font-bold tracking-wide text-gray-600 uppercase">
                                <tr>
                                    <th className="px-8 py-5">Class Name</th>

                                    <th className="px-8 py-5">
                                        Attendance Rate
                                    </th>

                                    <th className="px-8 py-5">Progress</th>
                                </tr>
                            </thead>

                            <tbody>
                                {classRates.length > 0 ? (
                                    classRates.map((item) => (
                                        <tr
                                            key={item.className}
                                            className="border-t"
                                        >
                                            <td className="px-8 py-5 font-bold text-gray-950">
                                                {item.className}
                                            </td>

                                            <td className="px-8 py-5 text-gray-900">
                                                {item.rate}%
                                            </td>

                                            <td className="px-8 py-5">
                                                <div className="h-3 w-full rounded-full bg-gray-200">
                                                    <div
                                                        className={`h-3 rounded-full ${
                                                            item.rate >= 90
                                                                ? 'bg-green-500'
                                                                : 'bg-yellow-500'
                                                        }`}
                                                        style={{
                                                            width: `${item.rate}%`,
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-8 py-12 text-center text-gray-500"
                                        >
                                            No class attendance rates yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

function StatCard({
    title,
    value,
    icon,
    bg,
    color,
}: {
    title: string;
    value: string;
    icon: ReactNode;
    bg: string;
    color: string;
}) {
    return (
        <div className="flex min-h-[145px] items-center gap-5 rounded-xl border bg-white p-7 shadow-sm">
            <div className={`rounded-xl p-4 ${bg} ${color}`}>{icon}</div>

            <div>
                <p className="text-lg text-gray-700">{title}</p>

                <h2 className="text-3xl font-bold text-gray-950">{value}</h2>
            </div>
        </div>
    );
}
