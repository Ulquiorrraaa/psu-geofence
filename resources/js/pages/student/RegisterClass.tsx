import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, GraduationCap, Link2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';

export default function RegisterClass() {
    const [value, setValue] = useState('');

    const [error, setError] = useState('');

    const [processing, setProcessing] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | Extract Registration Token
    |--------------------------------------------------------------------------
    |
    | Supports:
    |
    | 1. Token only
    |    abc123
    |
    | 2. Full URL
    |    http://127.0.0.1:8000/student/register-class/abc123
    |
    | 3. Relative URL
    |    /student/register-class/abc123
    |
    */

    const extractToken = (input: string): string => {
        let cleaned = input.trim();

        if (!cleaned) {
            return '';
        }

        /*
        |--------------------------------------------------------------------------
        | Remove accidental quotation marks
        |--------------------------------------------------------------------------
        */

        cleaned = cleaned.replace(/^["']+|["']+$/g, '').trim();

        /*
        |--------------------------------------------------------------------------
        | Full URL
        |--------------------------------------------------------------------------
        */

        try {
            if (
                cleaned.startsWith('http://') ||
                cleaned.startsWith('https://')
            ) {
                const url = new URL(cleaned);

                const parts = url.pathname.split('/').filter(Boolean);

                cleaned = parts[parts.length - 1] ?? '';
            }
        } catch {
            /*
             * If it is not a valid URL,
             * continue and treat it as
             * a normal token/path.
             */
        }

        /*
        |--------------------------------------------------------------------------
        | Relative URL / Path
        |--------------------------------------------------------------------------
        */

        if (cleaned.includes('/')) {
            const parts = cleaned.split('/').filter(Boolean);

            cleaned = parts[parts.length - 1] ?? '';
        }

        /*
        |--------------------------------------------------------------------------
        | Remove Query String / Hash
        |--------------------------------------------------------------------------
        */

        cleaned = cleaned.split('?')[0].split('#')[0].trim();

        return cleaned;
    };

    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (processing) {
            return;
        }

        const token = extractToken(value);

        /*
        |--------------------------------------------------------------------------
        | Empty Token
        |--------------------------------------------------------------------------
        */

        if (!token) {
            setError(
                'Please enter a registration link or class registration code.',
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Continue To Class
        |--------------------------------------------------------------------------
        */

        setError('');
        setProcessing(true);

        router.visit(`/student/register-class/${encodeURIComponent(token)}`, {
            method: 'get',

            preserveScroll: false,

            preserveState: false,

            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <>
            <Head title="Register for Class" />

            <main className="min-h-full bg-[#f7f8fa] px-4 py-8 sm:px-6 lg:px-8">
                <div className="w-full min-w-0">
                    {/* Back */}

                    <Link
                        href="/student/dashboard"
                        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-[#970028]"
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </Link>

                    {/* Card */}

                    <div className="overflow-hidden rounded-[26px] border border-gray-200 bg-white shadow-sm">
                        {/* Header */}

                        <div className="bg-[#970028] px-6 py-8 text-white sm:px-8">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                                    <GraduationCap size={29} />
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-white/80">
                                        Student Portal
                                    </p>

                                    <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                                        Register for Class
                                    </h1>
                                </div>
                            </div>
                        </div>

                        {/* Form */}

                        <form onSubmit={submit} className="p-6 sm:p-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-950">
                                    Join a Class
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-gray-600">
                                    Paste the registration link shared by your
                                    instructor, or enter the class registration
                                    code.
                                </p>
                            </div>

                            {/* Registration Link */}

                            <div className="mt-7">
                                <label
                                    htmlFor="registration-link"
                                    className="mb-2 block text-sm font-semibold text-gray-900"
                                >
                                    Registration Link or Code
                                </label>

                                <div className="relative">
                                    <Link2
                                        size={20}
                                        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400"
                                    />

                                    <input
                                        id="registration-link"
                                        type="text"
                                        value={value}
                                        onChange={(event) => {
                                            setValue(event.target.value);

                                            if (error) {
                                                setError('');
                                            }
                                        }}
                                        placeholder="Paste registration link or code"
                                        autoComplete="off"
                                        autoFocus
                                        className={`w-full rounded-2xl border bg-white py-3.5 pr-4 pl-12 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#970028]/10 ${
                                            error
                                                ? 'border-red-400 focus:border-red-500'
                                                : 'border-gray-300 focus:border-[#970028]'
                                        }`}
                                    />
                                </div>

                                {error && (
                                    <p className="mt-2 text-sm font-medium text-red-600">
                                        {error}
                                    </p>
                                )}
                            </div>

                            {/* Information */}

                            <div className="mt-7 rounded-2xl border border-[#ecd2d9] bg-[#fff7f9] p-4">
                                <p className="text-sm leading-6 text-gray-700">
                                    Your instructor can share the class
                                    registration link or QR code. Paste the link
                                    or code above to view the class. After
                                    checking the class information, click{' '}
                                    <span className="font-semibold text-[#970028]">
                                        Register for Class
                                    </span>
                                    .
                                </p>
                            </div>

                            {/* Submit */}

                            <button
                                type="submit"
                                disabled={processing}
                                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#970028] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#7d0021] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <GraduationCap size={20} />

                                {processing ? 'Checking Class...' : 'Continue'}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </>
    );
}
