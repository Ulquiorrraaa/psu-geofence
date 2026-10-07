import { Head, router } from '@inertiajs/react';
import {
    Check,
    Copy,
    Link2,
    RefreshCw,
    Search,
    ShieldCheck,
    ShieldOff,
    UserPlus,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type RegistrationLink = {
    id: number;
    url: string;
    token: string;
    isActive: boolean;
    isEnabled: boolean;
    expiresAt: string | null;
};

type RegisteredStudent = {
    id: number;
    studentId: number;
    name?: string | null;
    studentNumber?: string | null;
    yearLevel?: string | null;
    section?: string | null;
    email?: string | null;
    status?: string | null;
    registeredAt: string | null;
};

type Props = {
    registrationLink: RegistrationLink | null;

    registeredStudents: RegisteredStudent[];

    registeredCount: number;
};

export default function StudentRegistration({
    registrationLink,
    registeredStudents = [],
    registeredCount = 0,
}: Props) {
    const [copied, setCopied] = useState(false);

    const [processing, setProcessing] = useState(false);

    const [search, setSearch] = useState('');

    const [statusFilter, setStatusFilter] = useState('all');

    /*
    |--------------------------------------------------------------------------
    | Search / Filter
    |--------------------------------------------------------------------------
    */

    const filteredStudents = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return registeredStudents.filter((student) => {
            const matchesSearch =
                !keyword ||
                (student.name ?? '').toLowerCase().includes(keyword) ||
                (student.studentNumber ?? '').toLowerCase().includes(keyword) ||
                (student.yearLevel ?? '').toLowerCase().includes(keyword) ||
                (student.section ?? '').toLowerCase().includes(keyword) ||
                (student.email ?? '').toLowerCase().includes(keyword);

            const matchesStatus =
                statusFilter === 'all' ||
                (student.status ?? '').toLowerCase() === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [registeredStudents, search, statusFilter]);

    /*
    |--------------------------------------------------------------------------
    | Generate
    |--------------------------------------------------------------------------
    */

    const generateLink = () => {
        setProcessing(true);

        router.post(
            '/instructor/student-registration/link',
            {},
            {
                preserveScroll: true,

                onFinish: () => setProcessing(false),
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Regenerate
    |--------------------------------------------------------------------------
    */

    const regenerate = () => {
        const confirmed = window.confirm(
            'Regenerate the student registration link? The old link will stop working.',
        );

        if (!confirmed) {
            return;
        }

        setProcessing(true);

        router.patch(
            '/instructor/student-registration/link/regenerate',
            {},
            {
                preserveScroll: true,

                onFinish: () => setProcessing(false),
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Disable
    |--------------------------------------------------------------------------
    */

    const disable = () => {
        const confirmed = window.confirm('Disable student registration?');

        if (!confirmed) {
            return;
        }

        setProcessing(true);

        router.patch(
            '/instructor/student-registration/link/disable',
            {},
            {
                preserveScroll: true,

                onFinish: () => setProcessing(false),
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Enable
    |--------------------------------------------------------------------------
    */

    const enable = () => {
        setProcessing(true);

        router.patch(
            '/instructor/student-registration/link/enable',
            {},
            {
                preserveScroll: true,

                onFinish: () => setProcessing(false),
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Copy
    |--------------------------------------------------------------------------
    */

    const copyLink = async () => {
        if (!registrationLink?.url) {
            return;
        }

        try {
            await navigator.clipboard.writeText(registrationLink.url);
        } catch {
            const textarea = document.createElement('textarea');

            textarea.value = registrationLink.url;

            document.body.appendChild(textarea);

            textarea.select();

            document.execCommand('copy');

            textarea.remove();
        }

        setCopied(true);

        window.setTimeout(() => setCopied(false), 1800);
    };

    return (
        <>
            <Head title="Student Registration" />

            <main className="min-h-full bg-[#f7f8fa] px-4 py-6 sm:px-6 lg:px-8">
                <div className="w-full min-w-0">
                    <header>
                        <h1 className="text-3xl font-bold text-[#970027]">
                            Student Registration
                        </h1>

                        <p className="mt-2 text-sm text-slate-600 sm:text-base">
                            Share a registration link so students can submit
                            their school number, year level, and section.
                        </p>
                    </header>

                    {/* LINK CARD */}

                    <section className="mt-7 rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff0f4] text-[#970027]">
                                        <Link2 size={22} />
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-bold">
                                            Student Registration Link
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            This is separate from Register for
                                            Class.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-2 rounded-full bg-[#fff0f4] px-4 py-2 text-sm font-bold text-[#970027]">
                                    <Users size={17} />
                                    {registeredCount} Registered
                                </span>

                                {registrationLink && (
                                    <span
                                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                                            registrationLink.isActive
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {registrationLink.isActive ? (
                                            <ShieldCheck size={17} />
                                        ) : (
                                            <ShieldOff size={17} />
                                        )}

                                        {registrationLink.isActive
                                            ? 'Active'
                                            : 'Disabled'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {!registrationLink ? (
                            <div className="mt-7 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                                <UserPlus
                                    size={36}
                                    className="mx-auto text-[#970027]"
                                />

                                <h3 className="mt-4 text-lg font-bold">
                                    No student registration link yet
                                </h3>

                                <p className="mt-2 text-sm text-gray-500">
                                    Generate a registration link and send it to
                                    your students.
                                </p>

                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={generateLink}
                                    className="mt-5 rounded-xl bg-[#970027] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#7d0021] disabled:opacity-50"
                                >
                                    {processing
                                        ? 'Generating...'
                                        : 'Generate Student Registration Link'}
                                </button>
                            </div>
                        ) : (
                            <div className="mt-7">
                                <label className="mb-2 block text-sm font-bold text-gray-700">
                                    Registration Link
                                </label>

                                <div className="flex flex-col gap-3 lg:flex-row">
                                    <input
                                        readOnly
                                        value={registrationLink.url}
                                        className="h-12 min-w-0 flex-1 rounded-xl border border-gray-300 bg-gray-50 px-4 text-sm"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => void copyLink()}
                                        disabled={!registrationLink.isActive}
                                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 text-sm font-bold transition hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        {copied ? (
                                            <Check size={17} />
                                        ) : (
                                            <Copy size={17} />
                                        )}

                                        {copied ? 'Copied' : 'Copy Link'}
                                    </button>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={regenerate}
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold"
                                    >
                                        <RefreshCw size={16} />
                                        Regenerate Link
                                    </button>

                                    {registrationLink.isActive ? (
                                        <button
                                            type="button"
                                            onClick={disable}
                                            disabled={processing}
                                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700"
                                        >
                                            <ShieldOff size={16} />
                                            Disable Link
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={enable}
                                            disabled={processing}
                                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700"
                                        >
                                            <ShieldCheck size={16} />
                                            Enable Link
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* REGISTERED STUDENTS */}

                    <section className="mt-7 overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
                        <header className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-xl font-bold">
                                    Registered Students
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Students who registered using your Student
                                    Registration Link.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="flex h-11 items-center gap-2 rounded-xl border border-gray-300 bg-gray-50 px-4">
                                    <Search
                                        size={17}
                                        className="text-gray-400"
                                    />

                                    <input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search student..."
                                        className="w-full bg-transparent text-sm outline-none sm:w-56"
                                    />
                                </div>

                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value)
                                    }
                                    className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm"
                                >
                                    <option value="all">All Status</option>

                                    <option value="active">Active</option>

                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </header>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
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
                                                className="px-5 py-4 text-left text-xs font-bold tracking-wide whitespace-nowrap text-gray-500 uppercase"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-5 py-12 text-center text-sm text-gray-500"
                                            >
                                                No registered students found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <tr
                                                key={student.id}
                                                className="hover:bg-gray-50"
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
                                                    {student.registeredAt ||
                                                        '—'}
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                                                            (
                                                                student.status ??
                                                                ''
                                                            ).toLowerCase() ===
                                                            'active'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                    >
                                                        {student.status ||
                                                            'Not recorded'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
