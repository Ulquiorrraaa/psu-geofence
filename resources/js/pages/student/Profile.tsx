import { Head, Link, usePage } from '@inertiajs/react';
import { Pencil, UserRound } from 'lucide-react';

type Student = {
    name: string;
    email: string;
    year: string | null;
    section: string | null;
    adviser: string | null;
};

type PageProps = { student: Student };

export default function StudentProfile() {
    const { student } = usePage().props as unknown as PageProps;
    const fields = [
        ['Name', student.name],
        ['Email', student.email],
        ['Year', student.year || 'Not set'],
        ['Section', student.section || 'Not set'],
        ['Adviser', student.adviser || 'Not assigned'],
    ];

    return (
        <>
            <Head title="My Profile" />
            <div className="min-h-screen px-4 py-6 sm:px-7 sm:py-8">
                <div className="mx-auto max-w-3xl">
                    <header className="mb-8 flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[#850027]">
                                My Profile
                            </h1>
                            <p className="mt-1 text-gray-600">
                                Your student account information
                            </p>
                        </div>
                        <Link
                            href="/settings/profile"
                            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#850027] px-4 text-sm font-semibold text-white hover:bg-[#65001d]"
                        >
                            <Pencil size={16} /> Edit profile
                        </Link>
                    </header>
                    <section className="border-y border-gray-200 bg-white">
                        <div className="flex items-center gap-4 border-b border-gray-100 px-5 py-6">
                            <div className="flex size-12 items-center justify-center rounded-full bg-pink-100 text-[#850027]">
                                <UserRound size={23} />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-950">
                                    {student.name}
                                </h2>
                                <p className="text-sm text-gray-600">Student</p>
                            </div>
                        </div>
                        <dl className="divide-y divide-gray-100 px-5">
                            {fields.map(([label, value]) => (
                                <div
                                    key={label}
                                    className="grid gap-1 py-4 sm:grid-cols-[150px_1fr] sm:gap-4"
                                >
                                    <dt className="text-sm text-gray-500">
                                        {label}
                                    </dt>
                                    <dd className="text-sm font-medium break-words text-gray-950">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                </div>
            </div>
        </>
    );
}
