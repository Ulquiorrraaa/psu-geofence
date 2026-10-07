import { Head, usePage } from '@inertiajs/react';
import { Clock, Download, Filter, MapPin, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { csvCell } from '@/lib/csv';

type Status = 'Present' | 'Absent' | 'Late';

type AttendanceRecord = {
    studentId: string;
    name: string;
    className: string;
    time: string;
    status: Status;
    location: string;
    coordinates: string;
};

type PageProps = {
    instructorAttendanceRecords?: AttendanceRecord[];
};

export default function Attendance() {
    const { instructorAttendanceRecords = [] } = usePage().props as PageProps;

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'All Status' | Status>('All Status');

    const filteredRecords = useMemo(() => {
        return instructorAttendanceRecords.filter((record) => {
            const keyword = search.toLowerCase();

            const matchesSearch =
                record.studentId.toLowerCase().includes(keyword) ||
                record.name.toLowerCase().includes(keyword) ||
                record.className.toLowerCase().includes(keyword);

            const matchesStatus =
                status === 'All Status' || record.status === status;

            return matchesSearch && matchesStatus;
        });
    }, [instructorAttendanceRecords, search, status]);

    const total = instructorAttendanceRecords.length;

    const present = instructorAttendanceRecords.filter(
        (record) => record.status === 'Present',
    ).length;

    const absent = instructorAttendanceRecords.filter(
        (record) => record.status === 'Absent',
    ).length;

    const late = instructorAttendanceRecords.filter(
        (record) => record.status === 'Late',
    ).length;

    function exportData() {
        const headers = [
            'Student ID',
            'Name',
            'Class',
            'Time',
            'Status',
            'Location',
            'Coordinates',
        ];

        const rows = filteredRecords.map((record) => [
            record.studentId,
            record.name,
            record.className,
            record.time,
            record.status,
            record.location,
            record.coordinates,
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map(csvCell).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'instructor-attendance-data.csv';
        link.click();

        URL.revokeObjectURL(url);
    }

    return (
        <>
            <Head title="Class Attendance" />

            <div className="min-h-full bg-[#f7f8fa] p-5 text-gray-900 sm:p-7">
                <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#8f001f]">
                            Class Attendance
                        </h1>

                        <p className="mt-1 text-base text-gray-600">
                            Monitor student attendance for your classes
                        </p>
                    </div>

                    <button
                        onClick={exportData}
                        className="flex items-center justify-center gap-2 rounded-lg bg-[#970027] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#790020]"
                    >
                        <Download size={20} />
                        Export Data
                    </button>
                </div>

                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="relative flex-1">
                            <Search
                                className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500"
                                size={22}
                            />

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, ID, or class..."
                                className="w-full rounded-lg border border-gray-300 px-11 py-3 text-base text-gray-900 outline-none focus:border-[#970027]"
                            />
                        </div>

                        <Filter className="text-gray-500" size={24} />

                        <select
                            value={status}
                            onChange={(e) =>
                                setStatus(
                                    e.target.value as 'All Status' | Status,
                                )
                            }
                            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-[#970027]"
                        >
                            <option>All Status</option>
                            <option>Present</option>
                            <option>Absent</option>
                            <option>Late</option>
                        </select>
                    </div>
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="Total Students" value={total} />
                    <StatCard
                        title="Present"
                        value={present}
                        color="text-green-600"
                    />
                    <StatCard
                        title="Absent"
                        value={absent}
                        color="text-red-600"
                    />
                    <StatCard title="Late" value={late} color="text-gray-700" />
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm">
                    <table className="w-full min-w-[760px] table-fixed text-left">
                        <thead className="bg-gray-50 text-sm font-bold tracking-wide text-gray-600 uppercase">
                            <tr>
                                <th className="w-[14%] px-8 py-5">
                                    Student ID
                                </th>
                                <th className="w-[18%] px-8 py-5">Name</th>
                                <th className="w-[20%] px-8 py-5">Class</th>
                                <th className="w-[16%] px-8 py-5">Time</th>
                                <th className="w-[14%] px-8 py-5">Status</th>
                                <th className="w-[18%] px-8 py-5">Location</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map((record, index) => (
                                    <tr
                                        key={`${record.studentId}-${index}`}
                                        className="border-t"
                                    >
                                        <td className="px-8 py-6 font-bold text-gray-950">
                                            {record.studentId}
                                        </td>

                                        <td className="px-8 py-6 text-gray-950">
                                            {record.name}
                                        </td>

                                        <td className="px-8 py-6 text-gray-800">
                                            {record.className}
                                        </td>

                                        <td className="px-8 py-6 text-gray-800">
                                            <div className="flex items-center gap-2">
                                                <Clock
                                                    size={18}
                                                    className="text-gray-500"
                                                />
                                                {record.time || '--'}
                                            </div>
                                        </td>

                                        <td className="px-8 py-6">
                                            <span
                                                className={`rounded-full px-4 py-2 text-sm font-bold ${
                                                    record.status === 'Present'
                                                        ? 'bg-green-100 text-green-700'
                                                        : record.status ===
                                                            'Absent'
                                                          ? 'bg-red-100 text-red-700'
                                                          : 'bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                {record.status}
                                            </span>
                                        </td>

                                        <td className="px-8 py-6 text-gray-800">
                                            <div className="flex items-start gap-2">
                                                <MapPin
                                                    size={18}
                                                    className="mt-1 text-gray-500"
                                                />
                                                <div>
                                                    <p>
                                                        {record.location ||
                                                            'Not detected'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {record.coordinates ||
                                                            '--'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-8 py-16 text-center text-gray-500"
                                    >
                                        No attendance records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

function StatCard({
    title,
    value,
    color = 'text-gray-950',
}: {
    title: string;
    value: number;
    color?: string;
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-gray-900 shadow-sm">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <h2 className={`mt-2 text-3xl font-bold ${color}`}>{value}</h2>
        </div>
    );
}
