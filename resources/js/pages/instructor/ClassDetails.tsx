import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    Clock3,
    Copy,
    Link2,
    MapPin,
    RefreshCw,
    Search,
    ShieldCheck,
    ShieldOff,
    UserPlus,
    Users,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type ClassDetails = {
    id: number;
    subject: string;
    section?: string | null;
    startTime: string;
    endTime: string;
    location: string;
    status: string;
    registrationUrl?: string | null;
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

type RegistrationInfo = {
    hasLink: boolean;
    url: string | null;
    isActive: boolean;
    isEnabled: boolean;
    expiresAt: string | null;
    registeredCount: number;
};

type RegisteredStudent = {
    id: number;
    name: string;
    studentNumber: string;
    yearLevel: string;
    section: string;
    email: string;
    registeredAt: string | null;
    registrationStatus: string;
};

type RegistrationResponse = {
    registration: RegistrationInfo;
    students: RegisteredStudent[];
};

export default function ClassDetailsPage() {
    const {
        classDetails,
        students = [],
        statistics,
    } = usePage<PageProps>().props;

    /*
    |--------------------------------------------------------------------------
    | Attendance roster search
    |--------------------------------------------------------------------------
    */

    const [search, setSearch] = useState('');

    const filteredStudents = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) {
            return students;
        }

        return students.filter((student) => {
            return (
                student.name.toLowerCase().includes(keyword) ||
                student.studentNumber.toLowerCase().includes(keyword)
            );
        });
    }, [search, students]);

    /*
    |--------------------------------------------------------------------------
    | Registration Link Data
    |--------------------------------------------------------------------------
    */

    const [registration, setRegistration] = useState<RegistrationInfo>({
        hasLink: Boolean(classDetails.registrationUrl),

        url: classDetails.registrationUrl ?? null,

        isActive: false,

        isEnabled: false,

        expiresAt: null,

        registeredCount: 0,
    });

    const [registeredStudents, setRegisteredStudents] = useState<
        RegisteredStudent[]
    >([]);

    const [loadingRegistration, setLoadingRegistration] = useState(true);

    const [registrationError, setRegistrationError] = useState<string | null>(
        null,
    );

    const [actionLoading, setActionLoading] = useState(false);

    const [copied, setCopied] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | Registered Students Filters
    |--------------------------------------------------------------------------
    */

    const [registrationSearch, setRegistrationSearch] = useState('');

    const [registrationStatus, setRegistrationStatus] = useState('all');

    /*
    |--------------------------------------------------------------------------
    | Load Registration Information
    |--------------------------------------------------------------------------
    */

    const loadRegistration = useCallback(
        (signal?: AbortSignal) => {
            return fetch(
                `/instructor/classes/${classDetails.id}/registration-link`,
                {
                    credentials: 'same-origin',
                    headers: { Accept: 'application/json' },
                    signal,
                },
            )
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error(
                            'Unable to load registration information.',
                        );
                    }

                    return (await response.json()) as RegistrationResponse;
                })
                .then((result) => {
                    setRegistrationError(null);
                    setRegistration(result.registration);
                    setRegisteredStudents(result.students);
                })
                .catch((error: unknown) => {
                    if (!signal?.aborted) {
                        setRegistrationError(
                            error instanceof Error
                                ? error.message
                                : 'Unable to load registration information.',
                        );
                    }
                })
                .finally(() => {
                    if (!signal?.aborted) {
                        setLoadingRegistration(false);
                    }
                });
        },
        [classDetails.id],
    );

    useEffect(() => {
        const controller = new AbortController();
        void loadRegistration(controller.signal);

        return () => controller.abort();
    }, [loadRegistration]);

    /*
    |--------------------------------------------------------------------------
    | Generate Link
    |--------------------------------------------------------------------------
    */

    const generateLink = () => {
        setActionLoading(true);

        router.post(
            `/instructor/classes/${classDetails.id}/registration-link`,
            {},
            {
                preserveScroll: true,

                onSuccess: () => {
                    void loadRegistration();
                },

                onFinish: () => {
                    setActionLoading(false);
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Regenerate Link
    |--------------------------------------------------------------------------
    */

    const regenerateLink = () => {
        const confirmed = window.confirm(
            'Regenerate this registration link? The old link will immediately stop working.',
        );

        if (!confirmed) {
            return;
        }

        setActionLoading(true);

        router.patch(
            `/instructor/classes/${classDetails.id}/registration-link/regenerate`,
            {},
            {
                preserveScroll: true,

                onSuccess: () => {
                    void loadRegistration();
                },

                onFinish: () => {
                    setActionLoading(false);
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Disable Link
    |--------------------------------------------------------------------------
    */

    const disableLink = () => {
        const confirmed = window.confirm('Disable this registration link?');

        if (!confirmed) {
            return;
        }

        setActionLoading(true);

        router.patch(
            `/instructor/classes/${classDetails.id}/registration-link/disable`,
            {},
            {
                preserveScroll: true,

                onSuccess: () => {
                    void loadRegistration();
                },

                onFinish: () => {
                    setActionLoading(false);
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Enable Link
    |--------------------------------------------------------------------------
    */

    const enableLink = () => {
        setActionLoading(true);

        router.patch(
            `/instructor/classes/${classDetails.id}/registration-link/enable`,
            {},
            {
                preserveScroll: true,

                onSuccess: () => {
                    void loadRegistration();
                },

                onFinish: () => {
                    setActionLoading(false);
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Copy Registration Link
    |--------------------------------------------------------------------------
    */

    const copyLink = async () => {
        if (!registration.url || !registration.isActive) {
            return;
        }

        try {
            await navigator.clipboard.writeText(registration.url);

            setCopied(true);

            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            const textarea = document.createElement('textarea');

            textarea.value = registration.url;

            textarea.style.position = 'fixed';

            textarea.style.left = '-9999px';

            document.body.appendChild(textarea);

            textarea.select();

            document.execCommand('copy');

            textarea.remove();

            setCopied(true);

            window.setTimeout(() => setCopied(false), 1800);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Registered Student Search / Filter
    |--------------------------------------------------------------------------
    */

    const filteredRegisteredStudents = useMemo(() => {
        const keyword = registrationSearch.trim().toLowerCase();

        return registeredStudents.filter((student) => {
            const matchesSearch =
                !keyword ||
                student.name.toLowerCase().includes(keyword) ||
                student.studentNumber.toLowerCase().includes(keyword) ||
                student.email.toLowerCase().includes(keyword) ||
                student.section.toLowerCase().includes(keyword);

            const matchesStatus =
                registrationStatus === 'all' ||
                student.registrationStatus.toLowerCase() === registrationStatus;

            return matchesSearch && matchesStatus;
        });
    }, [registeredStudents, registrationSearch, registrationStatus]);

    return (
        <>
            <Head title={classDetails.subject} />

            <main className="min-h-full bg-[#f7f8fa] px-5 py-7 text-slate-950 sm:px-7 lg:px-8">
                <div className="w-full min-w-0">
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
                        Section: {classDetails.section || 'Not assigned'}
                    </p>

                    {/* CLASS INFO */}

                    <section className="mt-7 flex flex-col gap-5 rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-7">
                            <span className="flex items-center gap-2">
                                <Clock3 size={21} className="text-[#970021]" />
                                {formatTime(classDetails.startTime)} –{' '}
                                {formatTime(classDetails.endTime)}
                            </span>

                            <span className="flex items-center gap-2">
                                <MapPin size={21} className="text-[#970021]" />

                                {classDetails.location}
                            </span>
                        </div>

                        <StatusBadge status={classDetails.status} />
                    </section>

                    {/* ATTENDANCE STATISTICS */}

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

                    {/* =====================================================
                        STUDENT REGISTRATION LINK
                    ===================================================== */}

                    <section className="mt-6 rounded-[22px] border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Link2
                                        size={22}
                                        className="text-[#970027]"
                                    />

                                    <h2 className="text-2xl font-bold">
                                        Student Registration Link
                                    </h2>
                                </div>

                                <p className="mt-2 text-sm text-slate-500">
                                    Generate and share a unique registration
                                    link for this class.
                                </p>
                            </div>

                            {!loadingRegistration && (
                                <div className="flex flex-wrap gap-2">
                                    <span
                                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                                            registration.isActive
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {registration.isActive ? (
                                            <ShieldCheck size={15} />
                                        ) : (
                                            <ShieldOff size={15} />
                                        )}

                                        {registration.isActive
                                            ? 'Active'
                                            : 'Disabled'}
                                    </span>

                                    <span className="inline-flex items-center gap-2 rounded-full bg-[#fff0f3] px-3 py-1.5 text-xs font-bold text-[#970027]">
                                        <Users size={15} />
                                        {registration.registeredCount}{' '}
                                        Registered
                                    </span>
                                </div>
                            )}
                        </div>

                        {loadingRegistration ? (
                            <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                                Loading registration information...
                            </div>
                        ) : registrationError ? (
                            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                                {registrationError}
                            </div>
                        ) : !registration.hasLink ? (
                            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
                                <UserPlus
                                    size={32}
                                    className="mx-auto text-[#970027]"
                                />

                                <h3 className="mt-3 font-bold">
                                    No registration link yet
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Generate a secure registration link and send
                                    it to your students.
                                </p>

                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={generateLink}
                                    className="mt-5 rounded-xl bg-[#970027] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                                >
                                    {actionLoading
                                        ? 'Generating...'
                                        : 'Generate Registration Link'}
                                </button>
                            </div>
                        ) : (
                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Registration Link
                                </label>

                                <div className="flex flex-col gap-2 lg:flex-row">
                                    <input
                                        readOnly
                                        value={registration.url ?? ''}
                                        className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-700"
                                    />

                                    <button
                                        type="button"
                                        disabled={!registration.isActive}
                                        onClick={() => void copyLink()}
                                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {copied ? (
                                            <Check
                                                size={17}
                                                className="text-emerald-600"
                                            />
                                        ) : (
                                            <Copy size={17} />
                                        )}

                                        {copied ? 'Copied' : 'Copy Link'}
                                    </button>
                                </div>

                                {!registration.isActive && (
                                    <p className="mt-2 text-sm font-medium text-red-600">
                                        This link is currently disabled and
                                        students cannot register through it.
                                    </p>
                                )}

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={regenerateLink}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        <RefreshCw size={16} />
                                        Regenerate Link
                                    </button>

                                    {registration.isActive ? (
                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={disableLink}
                                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                        >
                                            <ShieldOff size={16} />
                                            Disable Link
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={enableLink}
                                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                        >
                                            <ShieldCheck size={16} />
                                            Enable Link
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* =====================================================
                        REGISTERED STUDENTS
                    ===================================================== */}

                    <section className="mt-6 overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-sm">
                        <header className="flex flex-col gap-4 border-b border-slate-200 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Registered Students
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Students registered directly to this class.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4">
                                    <Search
                                        size={18}
                                        className="text-slate-400"
                                    />

                                    <input
                                        value={registrationSearch}
                                        onChange={(event) =>
                                            setRegistrationSearch(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Search student..."
                                        className="w-full bg-transparent text-sm outline-none sm:w-52"
                                    />
                                </label>

                                <select
                                    value={registrationStatus}
                                    onChange={(event) =>
                                        setRegistrationStatus(
                                            event.target.value,
                                        )
                                    }
                                    className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none"
                                >
                                    <option value="all">All Status</option>

                                    <option value="active">Active</option>

                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </header>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {[
                                            'Student Name',
                                            'Student Number',
                                            'Year Level',
                                            'Section',
                                            'Email',
                                            'Date Registered',
                                            'Status',
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className="px-5 py-3.5 text-left text-xs font-bold tracking-wide whitespace-nowrap text-slate-500 uppercase"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {loadingRegistration ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-5 py-10 text-center text-sm text-slate-500"
                                            >
                                                Loading students...
                                            </td>
                                        </tr>
                                    ) : filteredRegisteredStudents.length ===
                                      0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-5 py-10 text-center text-sm text-slate-500"
                                            >
                                                No registered students found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRegisteredStudents.map(
                                            (student) => (
                                                <tr
                                                    key={student.id}
                                                    className="hover:bg-slate-50"
                                                >
                                                    <td className="px-5 py-4 text-sm font-bold whitespace-nowrap">
                                                        {student.name}
                                                    </td>

                                                    <td className="px-5 py-4 text-sm whitespace-nowrap">
                                                        {student.studentNumber}
                                                    </td>

                                                    <td className="px-5 py-4 text-sm whitespace-nowrap">
                                                        {student.yearLevel}
                                                    </td>

                                                    <td className="px-5 py-4 text-sm whitespace-nowrap">
                                                        {student.section}
                                                    </td>

                                                    <td className="px-5 py-4 text-sm whitespace-nowrap">
                                                        {student.email}
                                                    </td>

                                                    <td className="px-5 py-4 text-sm whitespace-nowrap">
                                                        {student.registeredAt ??
                                                            '—'}
                                                    </td>

                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                                                                student.registrationStatus.toLowerCase() ===
                                                                'active'
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-slate-100 text-slate-600'
                                                            }`}
                                                        >
                                                            {
                                                                student.registrationStatus
                                                            }
                                                        </span>
                                                    </td>
                                                </tr>
                                            ),
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* =====================================================
                        EXISTING ATTENDANCE STUDENT ROSTER
                    ===================================================== */}

                    <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <header className="flex flex-col gap-4 border-b border-slate-200 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Student Roster
                                </h2>

                                <p className="mt-1 text-sm">
                                    {statistics.total} students enrolled in{' '}
                                    {classDetails.section || 'this class'}
                                </p>
                            </div>

                            <label className="flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 py-2">
                                <Search size={18} className="text-slate-400" />

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
                            filteredStudents.map((student, index) => (
                                <StudentRow
                                    key={student.id}
                                    student={student}
                                    number={index + 1}
                                />
                            ))
                        ) : (
                            <div className="flex h-44 items-center justify-center text-slate-500">
                                No students found.
                            </div>
                        )}
                    </section>
                </div>
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
            className={`rounded-xl border border-gray-200 px-5 py-5 text-center shadow-sm ${color}`}
        >
            <p className="text-3xl font-bold">{value}</p>

            <p className="mt-2 text-black">{label}</p>
        </article>
    );
}

function StudentRow({ student, number }: { student: Student; number: number }) {
    const initial = student.name.trim().charAt(0).toUpperCase();

    return (
        <article className="grid gap-4 border-b border-slate-200 px-6 py-5 last:border-b-0 sm:grid-cols-[30px_48px_1fr_auto_auto] sm:items-center">
            <span className="text-sm text-slate-400">{number}</span>

            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 font-semibold text-[#970021]">
                {initial}
            </span>

            <div>
                <h3 className="font-semibold">{student.name}</h3>

                <p className="text-sm">{student.studentNumber}</p>
            </div>

            <span className="flex items-center gap-2 text-sm">
                <Clock3 size={16} className="text-slate-400" />

                {student.timeIn || '—'}
            </span>

            <StudentStatus status={student.status} />
        </article>
    );
}

function StudentStatus({ status }: { status: Student['status'] }) {
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

function StatusBadge({ status }: { status: string }) {
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

    /*
    |--------------------------------------------------------------------------
    | Your InstructorDashboardController may already return:
    |
    | 08:00 AM
    |
    | In that case don't process it again.
    |--------------------------------------------------------------------------
    */

    if (
        value.toUpperCase().includes('AM') ||
        value.toUpperCase().includes('PM')
    ) {
        return value;
    }

    const [hourValue, minuteValue] = value.slice(0, 5).split(':').map(Number);

    const period = hourValue >= 12 ? 'PM' : 'AM';

    const hour = hourValue % 12 || 12;

    return `${hour.toString().padStart(2, '0')}:${minuteValue
        .toString()
        .padStart(2, '0')} ${period}`;
}
