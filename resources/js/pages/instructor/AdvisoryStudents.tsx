import { Head, usePage, usePoll } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import ProfileAvatar from '@/components/profile-avatar';
import {
    normalizeYear,
    sectionForYear,
} from '@/components/student-academic-select';

type Student = {
    id: number;
    name: string;
    student_id: string | null;
    email: string;
    course: string | null;
    year: string | null;
    section: string | null;
    status: string;
    profile_picture_url: string | null;
};
export default function AdvisoryStudents() {
    const { students } = usePage<{ students: Student[] }>().props;
    usePoll(30000, { only: ['students'] });
    const [search, setSearch] = useState('');
    const [section, setSection] = useState('');
    const [page, setPage] = useState(1);
    const group = (student: Student) =>
        [
            student.course?.trim().toUpperCase() || 'No course',
            normalizeYear(student.year) || 'No year',
            sectionForYear(student.section, student.year || '')
                .trim()
                .toUpperCase() || 'No section',
        ].join(' · ');
    const groups = useMemo(
        () => Array.from(new Set(students.map(group))).sort(),
        [students],
    );
    const filtered = students.filter(
        (student) =>
            (!section || group(student) === section) &&
            [
                student.name,
                student.student_id || '',
                student.email,
                group(student),
            ]
                .join(' ')
                .toLowerCase()
                .includes(search.trim().toLowerCase()),
    );
    const pages = Math.max(1, Math.ceil(filtered.length / 20));
    const currentPage = Math.min(page, pages);
    const control =
        'h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-[#970027] focus:outline-none focus:ring-2 focus:ring-[#970027]/10';

    return (
        <>
            <Head title="My Advisory Students" />
            <main className="min-w-0 space-y-6 bg-[#f7f8fa] p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-3xl font-bold text-[#970027]">
                            My Advisory Students
                        </h1>
                        <p className="mt-2 text-gray-500">
                            Students assigned to you as adviser by the
                            administrator.
                        </p>
                    </div>
                    <div className="inline-flex w-fit shrink-0 items-center gap-4 rounded-2xl border border-[#970027]/10 bg-white px-5 py-3 shadow-sm">
                        <span className="text-sm font-medium text-gray-500">
                            Total Students
                        </span>
                        <span className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-[#970027]/5 px-3 text-2xl font-bold text-[#970027] tabular-nums">
                            {students.length}
                        </span>
                    </div>
                </header>
                <section className="rounded-2xl border bg-white p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium">
                            Search students
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Name, student ID, or email"
                                className={control}
                            />
                        </label>
                        <label className="space-y-2 text-sm font-medium">
                            Course, year and section
                            <select
                                value={section}
                                onChange={(e) => {
                                    setSection(e.target.value);
                                    setPage(1);
                                }}
                                className={control}
                            >
                                <option value="">All assigned sections</option>
                                {groups.map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </section>
                <section className="min-w-0 overflow-hidden rounded-2xl border bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    {[
                                        'Student',
                                        'Student ID',
                                        'Course / Year / Section',
                                        'Email',
                                        'Status',
                                    ].map((label) => (
                                        <th
                                            key={label}
                                            className="px-5 py-4 font-semibold"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filtered
                                    .slice(
                                        (currentPage - 1) * 20,
                                        currentPage * 20,
                                    )
                                    .map((student) => (
                                        <tr
                                            key={student.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <ProfileAvatar
                                                        name={student.name}
                                                        url={
                                                            student.profile_picture_url
                                                        }
                                                    />
                                                    <span className="font-semibold">
                                                        {student.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {student.student_id || '—'}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {group(student)}
                                            </td>
                                            <td className="px-5 py-4">
                                                {student.email}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={
                                                        'rounded-full px-3 py-1 text-xs font-semibold ' +
                                                        (student.status ===
                                                        'Active'
                                                            ? 'bg-green-50 text-green-700'
                                                            : 'bg-gray-100 text-gray-600')
                                                    }
                                                >
                                                    {student.status ||
                                                        'Unknown'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                {!filtered.length && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-12 text-center text-gray-500"
                                        >
                                            {students.length
                                                ? 'No students match your search or section filter.'
                                                : 'No advisory students assigned yet. Students will appear here when the admin assigns you as their section adviser.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-sm text-gray-500">
                        <span>
                            {filtered.length} students · Page {currentPage} of{' '}
                            {pages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setPage(currentPage - 1)}
                                className="rounded-lg border px-3 py-2 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                disabled={currentPage === pages}
                                onClick={() => setPage(currentPage + 1)}
                                className="rounded-lg border px-3 py-2 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </footer>
                </section>
            </main>
        </>
    );
}
