import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import StudentAcademicSelect, {
    normalizeYear,
    sectionForYear,
} from '@/components/student-academic-select';

type Student = {
    name: string;
    studentNumber?: string | null;
    email: string;
    course?: string | null;
    yearLevel?: string | null;
    section?: string | null;
};
type Registration = {
    fullName: string;
    studentNumber: string;
    email: string;
    course: string;
    yearLevel: string;
    section: string;
    registeredAt: string;
};
type Props = {
    token: string | null;
    student: Student;
    alreadyRegistered: boolean;
    registration: Registration | null;
};

// Read only the path of known general registration URLs; never navigate to pasted hosts.
function extractToken(input: string): string {
    const value = input.trim();

    if (/^[A-Za-z0-9_-]{1,100}$/.test(value)) {
        return value;
    }

    try {
        const url = new URL(value, window.location.origin);

        if (!['http:', 'https:'].includes(url.protocol)) {
            return '';
        }

        const match = url.pathname.match(
            /\/(?:student-registration|student\/register|student\/registration)\/([A-Za-z0-9_-]{1,100})\/?$/,
        );

        return match?.[1] ?? '';
    } catch {
        return '';
    }
}

export default function StudentRegistration({
    token,
    student,
    alreadyRegistered,
    registration,
}: Props) {
    const [link, setLink] = useState('');
    const [linkError, setLinkError] = useState('');
    const tokenForm = useForm({ token: '' });
    const form = useForm({
        token: token ?? '',
        full_name: student.name ?? '',
        student_number: student.studentNumber ?? '',
        email: student.email ?? '',
        course: student.course ?? '',
        year_level: normalizeYear(student.yearLevel),
        section: sectionForYear(
            student.section,
            normalizeYear(student.yearLevel),
        ),
    });
    const fields = [
        ['full_name', 'Full Name'],
        ['student_number', 'Student Number / Student ID'],
        ['email', 'Email'],
        ['course', 'Course'],
        ['year_level', 'Year Level'],
        ['section', 'Section'],
    ] as const;
    function continueRegistration(event: FormEvent) {
        event.preventDefault();
        const extracted = extractToken(link);
        setLinkError(
            extracted
                ? ''
                : 'Paste a valid general student registration link or token.',
        );

        if (extracted) {
            tokenForm.transform(() => ({ token: extracted }));
            tokenForm.post('/student/registration/validate', {
                preserveState: 'errors',
            });
        }
    }
    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({ ...data, token: token ?? '' }));
        form.post('/student/registration', { preserveState: 'errors' });
    }

    return (
        <>
            <Head title="Student Registration" />
            <main className="w-full min-w-0 space-y-6 p-4 md:p-8">
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-[#850027]">
                        Student Registration
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Paste the registration link provided to you.
                    </p>
                    <form
                        onSubmit={continueRegistration}
                        className="mt-5 space-y-3"
                    >
                        <label
                            htmlFor="registration-link"
                            className="block text-sm font-semibold"
                        >
                            Registration link or token
                        </label>
                        <input
                            id="registration-link"
                            value={link}
                            onChange={(event) => {
                                setLink(event.target.value);
                                setLinkError('');
                                tokenForm.clearErrors();
                            }}
                            placeholder="Paste registration link or token"
                            required
                            maxLength={2048}
                            className="w-full rounded-lg border border-gray-300 p-3"
                        />
                        {(linkError || tokenForm.errors.token) && (
                            <p role="alert" className="text-sm text-red-600">
                                {linkError || tokenForm.errors.token}
                            </p>
                        )}
                        <button
                            disabled={tokenForm.processing}
                            className="rounded-lg bg-[#850027] px-5 py-3 font-semibold text-white disabled:opacity-50"
                        >
                            Continue Registration
                        </button>
                    </form>
                </section>
                {token && (
                    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        {alreadyRegistered && registration ? (
                            <>
                                <h2 className="text-xl font-bold text-[#850027]">
                                    Registration Successful
                                </h2>
                                <p className="mt-2 text-gray-600">
                                    You are already registered using this
                                    instructor&apos;s registration link.
                                </p>
                                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                                    {fields.map(([key, label]) => {
                                        const values = {
                                            full_name: registration.fullName,
                                            student_number:
                                                registration.studentNumber,
                                            email: registration.email,
                                            course: registration.course,
                                            year_level: normalizeYear(
                                                registration.yearLevel,
                                            ),
                                            section: sectionForYear(
                                                registration.section,
                                                normalizeYear(
                                                    registration.yearLevel,
                                                ),
                                            ),
                                        };

                                        return (
                                            <div key={key}>
                                                <dt className="text-sm text-gray-500">
                                                    {label}
                                                </dt>
                                                <dd className="font-semibold break-words">
                                                    {values[key] ||
                                                        'Not recorded'}
                                                </dd>
                                            </div>
                                        );
                                    })}
                                    <div>
                                        <dt className="text-sm text-gray-500">
                                            Registration Date
                                        </dt>
                                        <dd>
                                            {registration.registeredAt
                                                ? new Date(
                                                      registration.registeredAt,
                                                  ).toLocaleString('en-PH', {
                                                      timeZone: 'Asia/Manila',
                                                  })
                                                : 'Not recorded'}
                                        </dd>
                                    </div>
                                </dl>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold text-[#850027]">
                                    Registration Information
                                </h2>
                                <form
                                    onSubmit={submit}
                                    className="mt-5 space-y-4"
                                >
                                    {fields.map(([key, label]) => (
                                        <div key={key}>
                                            <label
                                                htmlFor={key}
                                                className="mb-1 block text-sm font-semibold"
                                            >
                                                {label}
                                            </label>
                                            {key === 'course' ||
                                            key === 'year_level' ||
                                            key === 'section' ? (
                                                <StudentAcademicSelect
                                                    id={key}
                                                    field={
                                                        key === 'year_level'
                                                            ? 'year'
                                                            : key
                                                    }
                                                    value={form.data[key]}
                                                    year={form.data.year_level}
                                                    required
                                                    className="w-full min-w-0 rounded-lg border border-gray-300 bg-white p-3"
                                                    aria-invalid={Boolean(
                                                        form.errors[key],
                                                    )}
                                                    onChange={(event) => {
                                                        const value =
                                                            event.target.value;

                                                        if (
                                                            key === 'year_level'
                                                        ) {
                                                            form.setData({
                                                                ...form.data,
                                                                year_level:
                                                                    value,
                                                                section:
                                                                    sectionForYear(
                                                                        form
                                                                            .data
                                                                            .section,
                                                                        value,
                                                                    ),
                                                            });
                                                        } else {
                                                            form.setData(
                                                                key,
                                                                value,
                                                            );
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <input
                                                    id={key}
                                                    type={
                                                        key === 'email'
                                                            ? 'email'
                                                            : 'text'
                                                    }
                                                    required
                                                    maxLength={
                                                        [
                                                            'student_number',
                                                            'year_level',
                                                            'section',
                                                        ].includes(key)
                                                            ? 100
                                                            : 255
                                                    }
                                                    value={form.data[key]}
                                                    onChange={(event) =>
                                                        form.setData(
                                                            key,
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 p-3"
                                                />
                                            )}
                                            {form.errors[key] && (
                                                <p
                                                    role="alert"
                                                    className="mt-1 text-sm text-red-600"
                                                >
                                                    {form.errors[key]}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                    {(form.errors as Record<string, string>)
                                        .registration && (
                                        <p
                                            role="alert"
                                            className="text-red-600"
                                        >
                                            {
                                                (
                                                    form.errors as Record<
                                                        string,
                                                        string
                                                    >
                                                ).registration
                                            }
                                        </p>
                                    )}
                                    {form.errors.token && (
                                        <p
                                            role="alert"
                                            className="text-red-600"
                                        >
                                            {form.errors.token}
                                        </p>
                                    )}
                                    <button
                                        disabled={form.processing}
                                        className="w-full rounded-lg bg-[#850027] px-5 py-3 font-semibold text-white disabled:opacity-50"
                                    >
                                        {form.processing
                                            ? 'Registering...'
                                            : 'Register Student'}
                                    </button>
                                </form>
                            </>
                        )}
                    </section>
                )}
            </main>
        </>
    );
}
