import { Head, usePage } from '@inertiajs/react';
import { Clock3 } from 'lucide-react';

type AttendanceRecord = {
    id: number;
    status: string;
    time_in: string | null;
    schedule?: {
        subject: string;
        section: string | null;
        instructor: string;
    } | null;
};

type PageProps = { attendance: AttendanceRecord[] };

export default function StudentAttendance() {
    const { attendance = [] } = usePage().props as unknown as PageProps;

    return (
        <>
            <Head title="My Attendance" />
            <div className="min-h-screen px-4 py-6 sm:px-7 sm:py-8">
                <div className="mx-auto max-w-5xl">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-[#850027]">
                            Attendance History
                        </h1>
                        <p className="mt-1 text-gray-600">
                            Your recorded class attendance
                        </p>
                    </header>
                    {attendance.length ? (
                        <div className="overflow-x-auto border-y border-gray-200 bg-white">
                            <table className="w-full min-w-[600px] text-left text-sm">
                                <thead className="border-b border-gray-200 text-xs tracking-wide text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">
                                            Class
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Instructor
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Time in
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {attendance.map((record) => (
                                        <tr key={record.id}>
                                            <td className="px-4 py-4 font-semibold text-gray-950">
                                                {record.schedule?.subject ??
                                                    'Class unavailable'}
                                            </td>
                                            <td className="px-4 py-4 text-gray-700">
                                                {record.schedule?.instructor ??
                                                    '—'}
                                            </td>
                                            <td className="px-4 py-4 text-gray-700">
                                                <span className="flex items-center gap-2">
                                                    <Clock3 size={15} />
                                                    {record.time_in ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="font-semibold text-gray-800">
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="border-y border-gray-200 py-8 text-gray-600">
                            No attendance records yet.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
