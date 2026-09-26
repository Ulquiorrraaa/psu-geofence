import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    MapPin,
    Search,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type ClassDetails = {
    id: number;
    subject: string;
    section?: string | null;
    startTime: string;
    endTime: string;
    location: string;
    status: string;
};

type Student = {
    id: number;
    name: string;
    studentNumber: string;
    status: 'Present' | 'Late' | 'Absent';
    timeIn?: string | null;
};

type Statistics = {
    total: number;
    present: number;
    late: number;
    absent: number;
};

type PageProps = {
    classDetails: ClassDetails;
    students: Student[];
    statistics: Statistics;
};

export default function ClassDetailsPage() {
    const {
        classDetails,
        students = [],
        statistics,
    } = usePage().props as PageProps;

    const [search, setSearch] = useState('');

    const filteredStudents = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) {
            return students;
        }

        return students.filter((student) => {
            return (
                student.name.toLowerCase().includes(keyword) ||
                student.studentNumber
                    .toLowerCase()
                    .includes(keyword)
            );
        });
    }, [search, students]);

    return (
        <>
            <Head title={classDetails.subject} />

            <main className="min-h-screen bg-[#f6f7f9] px-5 py-8 text-slate-950 sm:px-8">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 font-semibold text-[#970021]"
                >
                    <ArrowLeft size={19} />
                    Back to Dashboard
                </Link>

                <h1 className="mt-4 text-3xl font-bold text-[#8f001f]">
                    {classDetails.subject}
                </h1>

                <p className="mt-1">
                    Section:{' '}
                    {classDetails.section || 'Not assigned'}
                </p>

                <section className="mt-7 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-7">
                        <span className="flex items-center gap-2">
                            <Clock3
                                size={21}
                                className="text-[#970021]"
                            />

                            {formatTime(classDetails.startTime)} –{' '}
                            {formatTime(classDetails.endTime)}
                        </span>

                        <span className="flex items-center gap-2">
                            <MapPin
                                size={21}
                                className="text-[#970021]"
                            />

                            {classDetails.location}
                        </span>
                    </div>

                    <StatusBadge status={classDetails.status} />
                </section>

                <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatisticCard
                        value={statistics.total}
                        label="Total"
                        color="bg-white text-black"
                    />

                    <StatisticCard
                        value={statistics.present}
                        label="Present"
                        color="bg-emerald-50 text-emerald-700"
                    />

                    <StatisticCard
                        value={statistics.late}
                        label="Late"
                        color="bg-amber-50 text-amber-700"
                    />

                    <StatisticCard
                        value={statistics.absent}
                        label="Absent"
                        color="bg-red-50 text-red-600"
                    />
                </section>

                <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <header className="flex flex-col gap-4 border-b border-slate-200 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">
                                Student Roster
                            </h2>

                            <p className="mt-1 text-sm">
                                {statistics.total} students enrolled
                                in{' '}
                                {classDetails.section ||
                                    'this class'}
                            </p>
                        </div>

                        <label className="flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 py-2">
                            <Search
                                size={18}
                                className="text-slate-400"
                            />

                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search student..."
                                className="w-full border-0 bg-transparent outline-none sm:w-44"
                            />
                        </label>
                    </header>

                    {filteredStudents.length > 0 ? (
                        filteredStudents.map(
                            (student, index) => (
                                <StudentRow
                                    key={student.id}
                                    student={student}
                                    number={index + 1}
                                />
                            ),
                        )
                    ) : (
                        <div className="flex h-44 items-center justify-center text-slate-500">
                            No students found.
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}

function StatisticCard({
    value,
    label,
    color,
}: {
    value: number;
    label: string;
    color: string;
}) {
    return (
        <article
            className={`rounded-2xl border border-slate-200 px-6 py-6 text-center shadow-sm ${color}`}
        >
            <p className="text-3xl font-bold">{value}</p>
            <p className="mt-2 text-black">{label}</p>
        </article>
    );
}

function StudentRow({
    student,
    number,
}: {
    student: Student;
    number: number;
}) {
    const initial = student.name
        .trim()
        .charAt(0)
        .toUpperCase();

    return (
        <article className="grid gap-4 border-b border-slate-200 px-6 py-5 last:border-b-0 sm:grid-cols-[30px_48px_1fr_auto_auto] sm:items-center">
            <span className="text-sm text-slate-400">
                {number}
            </span>

            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 font-semibold text-[#970021]">
                {initial}
            </span>

            <div>
                <h3 className="font-semibold">
                    {student.name}
                </h3>

                <p className="text-sm">
                    {student.studentNumber}
                </p>
            </div>

            <span className="flex items-center gap-2 text-sm">
                <Clock3
                    size={16}
                    className="text-slate-400"
                />

                {student.timeIn || '—'}
            </span>

            <StudentStatus status={student.status} />
        </article>
    );
}

function StudentStatus({
    status,
}: {
    status: Student['status'];
}) {
    if (status === 'Present') {
        return (
            <span className="flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                <CheckCircle2 size={17} />
                Present
            </span>
        );
    }

    if (status === 'Late') {
        return (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm text-amber-700">
                Late
            </span>
        );
    }

    return (
        <span className="flex items-center gap-2 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-600">
            <XCircle size={17} />
            Absent
        </span>
    );
}

function StatusBadge({
    status,
}: {
    status: string;
}) {
    const colors =
        status === 'Done'
            ? 'bg-slate-100 text-slate-900'
            : status === 'Ongoing'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-red-50 text-red-700';

    return (
        <span
            className={`rounded-full border border-slate-200 px-4 py-1 text-sm font-semibold ${colors}`}
        >
            {status}
        </span>
    );
}

function formatTime(value?: string) {
    if (!value) {
        return '--:--';
    }

    const [hourValue, minuteValue] = value
        .slice(0, 5)
        .split(':')
        .map(Number);

    const period = hourValue >= 12 ? 'PM' : 'AM';
    const hour = hourValue % 12 || 12;

    return `${hour.toString().padStart(2, '0')}:${minuteValue
        .toString()
        .padStart(2, '0')} ${period}`;
}