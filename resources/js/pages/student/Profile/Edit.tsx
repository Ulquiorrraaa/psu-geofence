import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import PasswordInput from '@/components/password-input';
import ProfilePictureForm from '@/components/profile-picture-form';
import StudentAcademicSelect, {
    normalizeYear,
    sectionForYear,
} from '@/components/student-academic-select';

type StudentProfile = {
    name: string | null;
    student_id: string | null;
    email: string | null;
    course: string | null;
    year: string | null;
    section: string | null;
};

const personalFields = [
    ['name', 'Full Name'],
    ['student_id', 'Student ID'],
    ['email', 'Email Address'],
    ['course', 'Course'],
    ['year', 'Year Level'],
    ['section', 'Section'],
] as const;

const passwordFields = [
    ['current_password', 'Current Password'],
    ['password', 'New Password'],
    ['password_confirmation', 'Confirm New Password'],
] as const;

const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition outline-none focus:border-[#850027] focus:ring-2 focus:ring-[#850027]/15';
const buttonClass =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#850027] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6d001f] disabled:cursor-not-allowed disabled:opacity-60';

export default function EditStudentProfile() {
    const { student } = usePage<{ student: StudentProfile }>().props;
    const form = useForm({
        name: student.name ?? '',
        student_id: student.student_id ?? '',
        email: student.email ?? '',
        course: student.course ?? '',
        year: normalizeYear(student.year),
        section: sectionForYear(student.section, normalizeYear(student.year)),
    });
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [passwordUpdated, setPasswordUpdated] = useState(false);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.patch('/student/profile');
    }

    function updatePassword(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPasswordUpdated(false);
        passwordForm.put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
                passwordForm.clearErrors();
                setPasswordUpdated(true);
            },
        });
    }

    return (
        <>
            <Head title="Edit Profile" />
            <main className="min-h-full bg-[#f7f8fa] px-3 py-4 sm:px-5 sm:py-6 lg:px-7 lg:py-8 xl:px-8">
                <div className="w-full min-w-0 space-y-6">
                    <header>
                        <Link
                            href="/student/profile"
                            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#850027] transition hover:text-[#6d001f]"
                        >
                            <ArrowLeft size={17} />
                            Back to Profile
                        </Link>
                        <h1 className="text-2xl leading-tight font-bold text-[#850027] sm:text-3xl">
                            Edit Profile
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 sm:text-base">
                            Update your personal information and password.
                        </p>
                    </header>

                    <ProfilePictureForm />
                    <section
                        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
                        aria-labelledby="personal-information-heading"
                    >
                        <h2
                            id="personal-information-heading"
                            className="mb-5 text-xl font-bold text-[#850027]"
                        >
                            Personal Information
                        </h2>
                        <form onSubmit={submit} className="space-y-5">
                            <div className="grid gap-5 sm:grid-cols-2">
                                {personalFields.map(([key, label]) => (
                                    <div key={key}>
                                        <label
                                            htmlFor={key}
                                            className="mb-2 block text-sm font-semibold text-gray-800"
                                        >
                                            {label}
                                        </label>
                                        {key === 'course' ||
                                        key === 'year' ||
                                        key === 'section' ? (
                                            <StudentAcademicSelect
                                                id={key}
                                                name={key}
                                                field={key}
                                                value={form.data[key]}
                                                year={form.data.year}
                                                required
                                                className={inputClass}
                                                aria-invalid={Boolean(
                                                    form.errors[key],
                                                )}
                                                aria-describedby={
                                                    form.errors[key]
                                                        ? key + '-error'
                                                        : undefined
                                                }
                                                onChange={(event) => {
                                                    const value =
                                                        event.target.value;

                                                    if (key === 'year') {
                                                        form.setData({
                                                            ...form.data,
                                                            year: value,
                                                            section:
                                                                sectionForYear(
                                                                    form.data
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
                                                name={key}
                                                type={
                                                    key === 'email'
                                                        ? 'email'
                                                        : 'text'
                                                }
                                                autoComplete={
                                                    key === 'name'
                                                        ? 'name'
                                                        : key === 'email'
                                                          ? 'email'
                                                          : undefined
                                                }
                                                required
                                                maxLength={
                                                    key === 'name' ||
                                                    key === 'email'
                                                        ? 255
                                                        : 100
                                                }
                                                value={form.data[key]}
                                                onChange={(event) =>
                                                    form.setData(
                                                        key,
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    form.errors[key],
                                                )}
                                                aria-describedby={
                                                    form.errors[key]
                                                        ? key + '-error'
                                                        : undefined
                                                }
                                                className={inputClass}
                                            />
                                        )}
                                        {form.errors[key] && (
                                            <p
                                                id={key + '-error'}
                                                className="mt-1 text-sm text-red-700"
                                            >
                                                {form.errors[key]}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                                <Link
                                    href="/student/profile"
                                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className={buttonClass}
                                >
                                    <Save size={17} />
                                    {form.processing
                                        ? 'Saving...'
                                        : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section
                        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
                        aria-labelledby="change-password-heading"
                    >
                        <h2
                            id="change-password-heading"
                            className="mb-5 text-xl font-bold text-[#850027]"
                        >
                            Change Password
                        </h2>
                        {passwordUpdated && (
                            <p
                                role="status"
                                className="mb-5 rounded-lg bg-green-50 p-3 text-sm text-green-800"
                            >
                                Password updated successfully.
                            </p>
                        )}
                        <form onSubmit={updatePassword} className="space-y-5">
                            <div className="grid gap-5 sm:grid-cols-2">
                                {passwordFields.map(([key, label]) => (
                                    <div
                                        key={key}
                                        className={
                                            key === 'current_password'
                                                ? 'sm:col-span-2'
                                                : undefined
                                        }
                                    >
                                        <label
                                            htmlFor={key}
                                            className="mb-2 block text-sm font-semibold text-gray-800"
                                        >
                                            {label}
                                        </label>
                                        <PasswordInput
                                            id={key}
                                            name={key}
                                            autoComplete={
                                                key === 'current_password'
                                                    ? 'current-password'
                                                    : 'new-password'
                                            }
                                            required
                                            value={passwordForm.data[key]}
                                            onChange={(event) => {
                                                setPasswordUpdated(false);
                                                passwordForm.setData(
                                                    key,
                                                    event.target.value,
                                                );
                                            }}
                                            aria-invalid={Boolean(
                                                passwordForm.errors[key],
                                            )}
                                            aria-describedby={
                                                passwordForm.errors[key]
                                                    ? key + '-error'
                                                    : undefined
                                            }
                                            className={
                                                inputClass + ' h-auto pr-10'
                                            }
                                        />
                                        {passwordForm.errors[key] && (
                                            <p
                                                id={key + '-error'}
                                                className="mt-1 text-sm text-red-700"
                                            >
                                                {passwordForm.errors[key]}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end border-t border-gray-100 pt-5">
                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className={buttonClass}
                                >
                                    {passwordForm.processing
                                        ? 'Updating...'
                                        : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </main>
        </>
    );
}
