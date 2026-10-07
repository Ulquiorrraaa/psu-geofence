import { Head, Link } from '@inertiajs/react';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function StudentRegistrationUnavailable() {
    return (
        <>
            <Head title="Registration Unavailable" />

            <main className="flex min-h-full items-center justify-center bg-[#f7f8fa] px-5">
                <section className="w-full max-w-lg rounded-[24px] border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <AlertCircle size={32} />
                    </div>

                    <h1 className="mt-6 text-2xl font-bold">
                        Student Registration Unavailable
                    </h1>

                    <p className="mt-3 text-gray-600">
                        This student registration link is no longer available.
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                        The instructor may have disabled or regenerated the
                        registration link.
                    </p>

                    <Link
                        href="/student/dashboard"
                        className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#970027] px-5 text-sm font-bold text-white"
                    >
                        <ArrowLeft size={17} />
                        Student Dashboard
                    </Link>
                </section>
            </main>
        </>
    );
}
