import { Head, usePage } from '@inertiajs/react';
import { Clock3, MapPin, UserRound, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

import GuardLayout from '@/layouts/guard-layout';

type ClassDetailsType = {
    id: number;
    subject: string;
    section: string;
    instructor: string;
    startTime: string;
    endTime: string;
    location: string;
    status: string;
};

type StudentItem = {
    id: number;
    name: string;
    studentNumber: string;
    course: string;
    year: string;
    section: string;
    status: 'Present' | 'Late' | 'Absent';
};

type Statistics = {
    total: number;
    present: number;
    late: number;
    absent: number;
};

type PageProps = {
    classDetails?: ClassDetailsType;
    students?: StudentItem[];
    statistics?: Statistics;
};

const filters = ['all', 'present', 'late', 'absent'] as const;
type Filter = (typeof filters)[number];

const statusClasses: Record<string, string> = {
    Present: 'bg-emerald-100 text-emerald-700',
    Late: 'bg-amber-100 text-amber-700',
    Absent: 'bg-rose-100 text-rose-700',
};

export default function GuardClassDetailsPage() {
    const {
        classDetails,
        students = [],
        statistics,
    } = usePage<PageProps>().props as PageProps;
    const [filter, setFilter] = useState<Filter>('all');

    const filteredStudents = useMemo(() => {
        if (filter === 'all') {
            return students;
        }

        return students.filter(
            (student) => student.status.toLowerCase() === filter,
        );
    }, [filter, students]);

    if (!classDetails) {
        return null;
    }

    const total = statistics?.total ?? students.length;

    return (
        <>
            <Head title={`${classDetails.subject} details`} />

            <GuardLayout
                title="Class Details"
                subtitle={`${classDetails.subject} • ${classDetails.section}`}
            >
                <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                    <div className="rounded-2xl border border-[#ecd9dc] bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold tracking-[0.14em] text-[#8a3d4c] uppercase">
                                    {classDetails.subject}
                                </p>
                                <h2 className="mt-2 text-2xl font-bold text-[#2d0b12]">
                                    {classDetails.section}
                                </h2>
                            </div>
                            <span className="rounded-full bg-[#f8e3e7] px-3 py-1 text-sm font-semibold text-[#7d0b1c]">
                                {classDetails.status}
                            </span>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-xl bg-[#faf0f1] p-4">
                                <p className="text-xs font-semibold tracking-[0.12em] text-[#7d0b1c] uppercase">
                                    Time
                                </p>
                                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-[#2d0b12]">
                                    <Clock3
                                        size={16}
                                        className="text-[#7d0b1c]"
                                    />
                                    {classDetails.startTime} -{' '}
                                    {classDetails.endTime}
                                </div>
                            </div>

                            <div className="rounded-xl bg-[#faf0f1] p-4">
                                <p className="text-xs font-semibold tracking-[0.12em] text-[#7d0b1c] uppercase">
                                    Instructor
                                </p>
                                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-[#2d0b12]">
                                    <UserRound
                                        size={16}
                                        className="text-[#7d0b1c]"
                                    />
                                    {classDetails.instructor}
                                </div>
                            </div>

                            <div className="rounded-xl bg-[#faf0f1] p-4">
                                <p className="text-xs font-semibold tracking-[0.12em] text-[#7d0b1c] uppercase">
                                    Location
                                </p>
                                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-[#2d0b12]">
                                    <MapPin
                                        size={16}
                                        className="text-[#7d0b1c]"
                                    />
                                    {classDetails.location}
                                </div>
                            </div>

                            <div className="rounded-xl bg-[#faf0f1] p-4">
                                <p className="text-xs font-semibold tracking-[0.12em] text-[#7d0b1c] uppercase">
                                    Students
                                </p>
                                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-[#2d0b12]">
                                    <Users
                                        size={16}
                                        className="text-[#7d0b1c]"
                                    />
                                    {total}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#ecd9dc] bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-lg font-bold text-[#2d0b12]">
                                Attendance overview
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {filters.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setFilter(option)}
                                        className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                                            filter === option
                                                ? 'bg-[#7d0b1c] text-white'
                                                : 'bg-[#f8e3e7] text-[#7d0b1c] hover:bg-[#f2d5db]'
                                        }`}
                                    >
                                        {option === 'all'
                                            ? 'All'
                                            : option[0].toUpperCase() +
                                              option.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-4">
                            <div className="rounded-xl bg-[#f8f8f8] p-4">
                                <p className="text-xs tracking-[0.12em] text-gray-500 uppercase">
                                    All
                                </p>
                                <p className="mt-2 text-2xl font-bold text-[#2d0b12]">
                                    {statistics?.total ?? total}
                                </p>
                            </div>
                            <div className="rounded-xl bg-[#EDF9F0] p-4">
                                <p className="text-xs tracking-[0.12em] text-emerald-700 uppercase">
                                    Present
                                </p>
                                <p className="mt-2 text-2xl font-bold text-emerald-700">
                                    {statistics?.present ?? 0}
                                </p>
                            </div>
                            <div className="rounded-xl bg-[#FFF7E8] p-4">
                                <p className="text-xs tracking-[0.12em] text-amber-700 uppercase">
                                    Late
                                </p>
                                <p className="mt-2 text-2xl font-bold text-amber-700">
                                    {statistics?.late ?? 0}
                                </p>
                            </div>
                            <div className="rounded-xl bg-[#FFF1F2] p-4">
                                <p className="text-xs tracking-[0.12em] text-rose-700 uppercase">
                                    Absent
                                </p>
                                <p className="mt-2 text-2xl font-bold text-rose-700">
                                    {statistics?.absent ?? 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#ecd9dc] bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-[#fff5f6] text-[#7d0b1c]">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">
                                            #
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Student
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Student Number
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Course / Section
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-8 text-center text-gray-500"
                                            >
                                                No students match this filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map(
                                            (student, index) => (
                                                <tr
                                                    key={student.id}
                                                    className="border-t border-[#f3e5e7]"
                                                >
                                                    <td className="px-4 py-3 text-[#4d2a33]">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8e3e7] text-sm font-bold text-[#7d0b1c]">
                                                                {student.name
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </span>
                                                            <div>
                                                                <p className="font-semibold text-[#2d0b12]">
                                                                    {
                                                                        student.name
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {
                                                                        student.year
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-[#4d2a33]">
                                                        {student.studentNumber}
                                                    </td>
                                                    <td className="px-4 py-3 text-[#4d2a33]">
                                                        {student.course} /{' '}
                                                        {student.section}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClasses[student.status] ?? 'bg-gray-100 text-gray-700'}`}
                                                        >
                                                            {student.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ),
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </GuardLayout>
        </>
    );
}
