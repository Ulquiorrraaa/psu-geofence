import { Head, Link, router, usePage } from '@inertiajs/react';

import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    GraduationCap,
    MapPin,
    UserRound,
} from 'lucide-react';

import { useState } from 'react';
import type { ReactNode } from 'react';

type ClassDetails = {
    id: number;
    subject: string;
    section?: string | null;
    instructor?: string | null;
    startTime: string;
    endTime: string;
    location?: string | null;
    days: string[];
};

type StudentDetails = {
    name?: string | null;
    studentNumber?: string | null;
    yearLevel?: string | null;
    section?: string | null;
    email?: string | null;
};

type Props = {
    token: string;
    alreadyRegistered: boolean;
    success?: string | null;

    classDetails: ClassDetails;

    student: StudentDetails;
};

type PageProps = {
    errors?: Record<string, string>;

    [key: string]: unknown;
};

export default function ClassRegistration({
    token,
    alreadyRegistered,
    success,
    classDetails,
    student,
}: Props) {
    const { errors = {} } = usePage<PageProps>().props;

    const [processing, setProcessing] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | Register To Class
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | No student information is submitted here.
    |
    | The backend uses the information already saved
    | in the authenticated student's account.
    |
    */

    const registerClass = () => {
        if (processing || alreadyRegistered) {
            return;
        }

        setProcessing(true);

        router.post(
            `/student/register-class/${encodeURIComponent(token)}`,
            {},
            {
                preserveScroll: true,

                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    const scheduleDays = Array.isArray(classDetails.days)
        ? classDetails.days.join(', ')
        : '';

    const studentInformationComplete = Boolean(
        student.studentNumber && student.yearLevel && student.section,
    );

    return (
        <>
            <Head title="Register for Class" />

            <main className="min-h-full bg-[#f7f8fa] px-4 py-8 sm:px-6 lg:px-8">
                <div className="w-full min-w-0">
                    <Link
                        href="/student/register-class"
                        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-[#970028]"
                    >
                        <ArrowLeft size={18} />
                        Enter Another Code
                    </Link>

                    <div className="overflow-hidden rounded-[26px] border border-gray-200 bg-white shadow-sm">
                        {/* Header */}

                        <div className="bg-[#970028] px-6 py-7 text-white sm:px-8">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                                    <GraduationCap size={25} />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-sm text-white/80">
                                        Class Registration
                                    </p>

                                    <h1 className="text-2xl font-bold break-words">
                                        {classDetails.subject}
                                    </h1>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5 p-6 sm:p-8">
                            {/* Success */}

                            {success && (
                                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-700">
                                    <CheckCircle2
                                        size={22}
                                        className="mt-0.5 shrink-0"
                                    />

                                    <div>
                                        <p className="font-semibold">Success</p>

                                        <p className="mt-1 text-sm">
                                            {success}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Already Registered */}

                            {alreadyRegistered && (
                                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-700">
                                    <CheckCircle2
                                        size={22}
                                        className="mt-0.5 shrink-0"
                                    />

                                    <div>
                                        <p className="font-semibold">
                                            Already Registered
                                        </p>

                                        <p className="mt-1 text-sm">
                                            This class is already connected to
                                            your student account.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Registration Error */}

                            {errors.registration && (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
                                    {errors.registration}
                                </div>
                            )}

                            {/* Class Information */}

                            <div>
                                <h2 className="mb-4 text-lg font-bold text-gray-900">
                                    Class Information
                                </h2>

                                <div className="space-y-3">
                                    <InfoRow
                                        icon={<GraduationCap size={20} />}
                                        label="Subject"
                                        value={classDetails.subject}
                                    />

                                    <InfoRow
                                        icon={<UserRound size={20} />}
                                        label="Instructor"
                                        value={
                                            classDetails.instructor ||
                                            'Not assigned'
                                        }
                                    />

                                    <InfoRow
                                        icon={<CalendarDays size={20} />}
                                        label="Class Section"
                                        value={
                                            classDetails.section ||
                                            'Open section'
                                        }
                                    />

                                    <InfoRow
                                        icon={<CalendarDays size={20} />}
                                        label="Class Days"
                                        value={scheduleDays || 'Not available'}
                                    />

                                    <InfoRow
                                        icon={<Clock3 size={20} />}
                                        label="Time"
                                        value={
                                            classDetails.startTime &&
                                            classDetails.endTime
                                                ? `${classDetails.startTime} – ${classDetails.endTime}`
                                                : 'Not available'
                                        }
                                    />

                                    <InfoRow
                                        icon={<MapPin size={20} />}
                                        label="Location"
                                        value={
                                            classDetails.location ||
                                            'No location'
                                        }
                                    />
                                </div>
                            </div>

                            {/* Student Account Information */}

                            {!alreadyRegistered && (
                                <div className="border-t border-gray-100 pt-6">
                                    <div className="mb-4">
                                        <h2 className="text-lg font-bold text-gray-900">
                                            Your Student Information
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-500">
                                            This information comes from Student
                                            Registration and cannot be changed
                                            here.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <ReadOnlyRow
                                            label="Full Name"
                                            value={student.name}
                                        />

                                        <ReadOnlyRow
                                            label="Student Number"
                                            value={student.studentNumber}
                                        />

                                        <ReadOnlyRow
                                            label="Year Level"
                                            value={student.yearLevel}
                                        />

                                        <ReadOnlyRow
                                            label="Section"
                                            value={student.section}
                                        />

                                        <ReadOnlyRow
                                            label="Email"
                                            value={student.email}
                                        />
                                    </div>

                                    {!studentInformationComplete && (
                                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                            Your student information is
                                            incomplete. Complete Student
                                            Registration before joining this
                                            class.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Button */}

                            <div className="pt-3">
                                {alreadyRegistered ? (
                                    <Link
                                        href="/student/dashboard"
                                        className="flex w-full items-center justify-center rounded-2xl bg-[#970028] px-5 py-3.5 font-semibold text-white transition hover:bg-[#7d0021]"
                                    >
                                        Go to Student Dashboard
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={
                                            processing ||
                                            !studentInformationComplete
                                        }
                                        onClick={registerClass}
                                        className="w-full rounded-2xl bg-[#970028] px-5 py-3.5 font-semibold text-white transition hover:bg-[#7d0021] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processing
                                            ? 'Registering...'
                                            : 'Register for Class'}
                                    </button>
                                )}
                            </div>

                            <p className="text-center text-xs leading-5 text-gray-500">
                                Register for Class only joins your existing
                                student account to this class. It does not
                                change your student information.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

/*
|--------------------------------------------------------------------------
| Read Only Student Information
|--------------------------------------------------------------------------
*/

function ReadOnlyRow({
    label,
    value,
}: {
    label: string;
    value?: string | null;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
                {label}
            </label>

            <div className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-700">
                {value || 'Not registered yet'}
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Information Row
|--------------------------------------------------------------------------
*/

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value?: string | null;
}) {
    return (
        <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
            <div className="mt-0.5 shrink-0 text-[#970028]">{icon}</div>

            <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    {label}
                </p>

                <p className="mt-1 font-medium break-words text-gray-900">
                    {value || 'Not available'}
                </p>
            </div>
        </div>
    );
}
