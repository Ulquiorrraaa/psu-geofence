import { Head, Link, usePage } from '@inertiajs/react';
import {
    GraduationCap,
    Mail,
    Pencil,
    School,
    UserRound,
    UsersRound,
} from 'lucide-react';
import ProfileAvatar from '@/components/profile-avatar';

type Student = {
    name?: string | null;
    profile_picture_url?: string | null;
    email?: string | null;
    course?: string | null;
    year?: string | null;
    section?: string | null;
    adviser?: string | null;
    student_id?: string | number | null;
};

type PageProps = {
    student?: Student | null;
};

export default function StudentProfile() {
    const { student } = usePage().props as unknown as PageProps;

    const studentName = student?.name?.trim() || 'Student';

    const courseSection = [student?.course, student?.section]
        .filter(Boolean)
        .join(' ');

    const profileFields = [
        {
            label: 'Full Name',
            value: student?.name || 'Not set',
            icon: UserRound,
        },
        {
            label: 'Student ID',
            value: student?.student_id || 'Not set',
            icon: GraduationCap,
        },
        {
            label: 'Email Address',
            value: student?.email || 'Not set',
            icon: Mail,
        },
        {
            label: 'Course',
            value: student?.course || 'Not set',
            icon: School,
        },
        {
            label: 'Year Level',
            value: student?.year || 'Not set',
            icon: GraduationCap,
        },
        {
            label: 'Section',
            value: student?.section || 'Not set',
            icon: UsersRound,
        },
        {
            label: 'Adviser',
            value: student?.adviser || 'Not assigned',
            icon: UserRound,
        },
    ];

    return (
        <>
            <Head title="My Profile" />

            {/*
                IMPORTANT:
                Do NOT add StudentLayout or StudentSidebar here.

                Your sidebar should already come from your existing
                student layout.

                This file only renders the PROFILE PAGE CONTENT.
            */}

            <div className="min-h-full w-full overflow-x-hidden bg-[#f7f8fa]">
                <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-7 lg:py-8 xl:px-8">
                    {/* PAGE HEADER */}
                    <header className="mb-5 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <h1 className="text-2xl leading-tight font-bold text-[#850027] sm:text-3xl">
                                My Profile
                            </h1>

                            <p className="mt-1 text-sm text-gray-600 sm:text-base">
                                View and manage your student account information
                            </p>
                        </div>

                        <Link
                            href="/student/profile/edit"
                            className="inline-flex min-h-10 w-fit shrink-0 items-center justify-center gap-2 rounded-xl bg-[#850027] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6d001f] focus:ring-2 focus:ring-[#850027]/30 focus:outline-none"
                        >
                            <Pencil size={16} />
                            Edit Profile
                        </Link>
                    </header>

                    <div className="space-y-5">
                        {/* STUDENT PROFILE CARD */}
                        <section className="flex min-w-0 flex-col gap-4 rounded-2xl bg-[#fff4f6] p-4 shadow-sm sm:flex-row sm:items-center sm:gap-5 sm:rounded-3xl sm:p-5 lg:p-6">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#f7dce4] text-[#850027] sm:h-20 sm:w-20">
                                <ProfileAvatar
                                    name={studentName}
                                    url={student?.profile_picture_url}
                                    className="size-16 sm:size-20"
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase sm:text-xs">
                                    Student Profile
                                </p>

                                <h2 className="mt-1 text-xl font-bold break-words text-gray-950 sm:text-2xl">
                                    {studentName}
                                </h2>

                                {student ? (
                                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
                                        {courseSection && (
                                            <span>{courseSection}</span>
                                        )}

                                        {courseSection &&
                                            student.student_id && (
                                                <span className="text-gray-400">
                                                    •
                                                </span>
                                            )}

                                        {student.student_id && (
                                            <span>{student.student_id}</span>
                                        )}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm text-gray-500">
                                        Student information unavailable
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* PERSONAL INFORMATION */}
                        <section className="overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5">
                                <h2 className="text-base font-bold text-gray-950 sm:text-lg">
                                    Personal Information
                                </h2>

                                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                                    Your account and student details
                                </p>
                            </div>

                            <div className="grid grid-cols-1 divide-y divide-gray-100 md:grid-cols-2 md:divide-y-0">
                                {profileFields.map(
                                    ({ label, value, icon: Icon }, index) => (
                                        <div
                                            key={label}
                                            className={[
                                                'flex min-w-0 items-start gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5',
                                                'border-gray-100',

                                                index % 2 === 0
                                                    ? 'md:border-r'
                                                    : '',

                                                index < profileFields.length - 2
                                                    ? 'md:border-b'
                                                    : '',
                                            ].join(' ')}
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0f4] text-[#850027]">
                                                <Icon size={19} />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                                    {label}
                                                </p>

                                                <p className="mt-1 text-sm font-semibold break-words text-gray-950 sm:text-base">
                                                    {String(value)}
                                                </p>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </>
    );
}
