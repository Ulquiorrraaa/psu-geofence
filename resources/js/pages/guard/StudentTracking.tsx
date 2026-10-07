import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

import GuardLayout from '@/layouts/guard-layout';

type StudentStatus =
    | 'In Class'
    | 'Late'
    | 'Absent'
    | 'Vacant / Free'
    | 'Classes Done';

type StudentItem = {
    id: number;
    name: string;
    studentNumber: string;
    course: string;
    year: string;
    section: string;
    status: StudentStatus;
    currentSubject?: string | null;
    currentInstructor?: string | null;
    location?: string | null;
    startTime?: string;
    endTime?: string;
};

type Summary = {
    inClass: number;
    late: number;
    absent: number;
    vacant: number;
    done: number;
};

type PageProps = {
    students?: StudentItem[];
    summary?: Summary;
};

const statusClasses: Record<StudentStatus, string> = {
    'In Class': 'bg-emerald-100 text-emerald-700',
    Late: 'bg-amber-100 text-amber-700',
    Absent: 'bg-rose-100 text-rose-700',
    'Vacant / Free': 'bg-slate-200 text-slate-700',
    'Classes Done': 'bg-violet-100 text-violet-700',
};

export default function GuardStudentTrackingPage() {
    const { students = [], summary } = usePage<PageProps>().props as PageProps;
    const [search, setSearch] = useState('');
    const [groupFilter, setGroupFilter] = useState('All');

    function yearSection(student: StudentItem): string {
        const section = student.section
            .trim()
            .toUpperCase()
            .replace(/^SECTION\s*/i, '')
            .replace(/[\s-]/g, '');
        const combined = section.match(/^([1-4])([A-Z]+)$/);

        if (combined) {
            return combined[1] + combined[2];
        }

        const year = student.year.match(/[1-4]/)?.[0];

        return year && /^[A-Z]+$/.test(section) && section !== 'NA'
            ? year + section
            : '';
    }

    const sectionGroups = [1, 2, 3, 4].map((year) => ({
        year: String(year),
        label: ['1st Year', '2nd Year', '3rd Year', '4th Year'][year - 1],
        sections: Array.from(
            new Set([
                ...['A', 'B', 'C'].map((section) => String(year) + section),
                ...students
                    .map(yearSection)
                    .filter((section) => section.startsWith(String(year))),
            ]),
        ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    }));

    const filteredStudents = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return students.filter((student) => {
            const matchesSearch =
                !keyword ||
                student.name.toLowerCase().includes(keyword) ||
                student.studentNumber.toLowerCase().includes(keyword);

            const group = yearSection(student);
            const year = group.charAt(0) || student.year.match(/[1-4]/)?.[0];
            const matchesGroup =
                groupFilter === 'All' ||
                (groupFilter.startsWith('year:')
                    ? year === groupFilter.slice(5)
                    : group === groupFilter);

            return matchesSearch && matchesGroup;
        });
    }, [search, students, groupFilter]);

    const summaryData = summary ?? {
        inClass: 0,
        late: 0,
        absent: 0,
        vacant: 0,
        done: 0,
    };

    return (
        <>
            <Head title="Student Tracking" />

            <GuardLayout
                title="Student Location Tracking"
                subtitle="Search a student to see their current class status and location"
            >
                <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                    <div className="rounded-2xl border border-[#ecd9dc] bg-[#fff7f7] p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7d0b1c] text-white">
                                <ShieldCheck size={18} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#2d0b12]">
                                    Guard Instructions
                                </h3>
                                <p className="mt-1 text-sm leading-6 text-[#4d2a33]">
                                    Search by student name or student number to
                                    review the student’s current status using
                                    real class schedules and live attendance
                                    records.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-2xl border border-[#ecd9dc] bg-white p-4 shadow-sm">
                            <p className="text-xs tracking-[0.12em] text-emerald-700 uppercase">
                                In Class
                            </p>
                            <p className="mt-3 text-3xl font-bold text-emerald-700">
                                {summaryData.inClass}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[#ecd9dc] bg-white p-4 shadow-sm">
                            <p className="text-xs tracking-[0.12em] text-amber-700 uppercase">
                                Late
                            </p>
                            <p className="mt-3 text-3xl font-bold text-amber-700">
                                {summaryData.late}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[#ecd9dc] bg-white p-4 shadow-sm">
                            <p className="text-xs tracking-[0.12em] text-rose-700 uppercase">
                                Absent
                            </p>
                            <p className="mt-3 text-3xl font-bold text-rose-700">
                                {summaryData.absent}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[#ecd9dc] bg-white p-4 shadow-sm">
                            <p className="text-xs tracking-[0.12em] text-slate-600 uppercase">
                                Vacant / Done
                            </p>
                            <p className="mt-3 text-3xl font-bold text-slate-600">
                                {summaryData.vacant + summaryData.done}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[#ecd9dc] bg-white p-4 shadow-sm">
                            <p className="text-xs tracking-[0.12em] text-violet-700 uppercase">
                                Classes Done
                            </p>
                            <p className="mt-3 text-3xl font-bold text-violet-700">
                                {summaryData.done}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#ecd9dc] bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <label className="relative block w-full max-w-lg">
                                <Search
                                    className="absolute top-1/2 left-3 -translate-y-1/2 text-[#7d0b1c]"
                                    size={18}
                                />
                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="h-12 w-full rounded-xl border border-[#ecd9dc] bg-[#fffaf9] pl-10 text-sm text-[#2d0b12] ring-0 outline-none placeholder:text-gray-400 focus:border-[#c98f9b]"
                                    placeholder="Search by name or student number"
                                />
                            </label>

                            <label className="flex w-full flex-col gap-1.5 text-sm font-semibold text-[#7d0b1c] lg:w-64 lg:shrink-0">
                                Year and section
                                <select
                                    value={groupFilter}
                                    onChange={(event) =>
                                        setGroupFilter(event.target.value)
                                    }
                                    className="h-12 w-full min-w-0 rounded-xl border border-[#ecd9dc] bg-[#fffaf9] px-3 text-sm text-[#2d0b12] outline-none focus:border-[#c98f9b]"
                                >
                                    <option value="All">
                                        All years and sections
                                    </option>
                                    {sectionGroups.map((group) => (
                                        <optgroup
                                            key={group.year}
                                            label={group.label}
                                        >
                                            <option
                                                value={'year:' + group.year}
                                            >
                                                All {group.label}
                                            </option>
                                            {group.sections.map((section) => (
                                                <option
                                                    key={section}
                                                    value={section}
                                                >
                                                    {section}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#ecd9dc] bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-[#fff5f6] text-[#7d0b1c]">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">
                                            Student
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Student Number
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Course
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Year
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Section
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
                                                colSpan={6}
                                                className="px-4 py-8 text-center text-gray-500"
                                            >
                                                No students match the current
                                                search.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <tr
                                                key={student.id}
                                                className="cursor-pointer border-t border-[#f3e5e7] transition focus-within:bg-[#fff5f6] hover:bg-[#fff5f6]"
                                                onClick={(event) => {
                                                    if (
                                                        !(
                                                            event.target as HTMLElement
                                                        ).closest('a, button')
                                                    ) {
                                                        router.visit(
                                                            '/guard/student-tracking/' +
                                                                student.id,
                                                        );
                                                    }
                                                }}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8e3e7] text-sm font-bold text-[#7d0b1c]">
                                                            {student.name
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </span>
                                                        <div>
                                                            <Link
                                                                href={
                                                                    '/guard/student-tracking/' +
                                                                    student.id
                                                                }
                                                                className="font-semibold text-[#2d0b12] underline-offset-4 hover:underline focus-visible:underline"
                                                            >
                                                                {student.name}
                                                            </Link>
                                                            {student.currentSubject && (
                                                                <p className="text-xs text-gray-500">
                                                                    {
                                                                        student.currentSubject
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-[#4d2a33]">
                                                    {student.studentNumber}
                                                </td>
                                                <td className="px-4 py-3 text-[#4d2a33]">
                                                    {student.course}
                                                </td>
                                                <td className="px-4 py-3 text-[#4d2a33]">
                                                    {student.year}
                                                </td>
                                                <td className="px-4 py-3 text-[#4d2a33]">
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
                                        ))
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
