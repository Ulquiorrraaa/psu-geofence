import { Head, Link, usePage } from '@inertiajs/react';

import {
    ArrowRight,
    CalendarCheck,
    Check,
    ClipboardCheck,
    MapPin,
    ShieldCheck,
    UserCheck,
    Users,
} from 'lucide-react';

import { login, register } from '@/routes';

interface AuthUser {
    id: number;
    name: string;
    role: string;
}

interface PageProps {
    auth?: {
        user?: AuthUser;
    };
    [key: string]: unknown;
}

interface WelcomeProps {
    canRegister?: boolean;
}

const statistics = [
    {
        title: 'Total Students',
        value: '1,247',
        description: 'Currently enrolled',
        icon: Users,
        iconColor: 'text-[#970027]',
        iconBackground: 'bg-[#970027]/10',
    },
    {
        title: 'Present Today',
        value: '1,156',
        description: '92.7% attendance rate',
        icon: UserCheck,
        iconColor: 'text-emerald-600',
        iconBackground: 'bg-emerald-100',
    },
    {
        title: 'Instructors',
        value: '48',
        description: 'Active faculty members',
        icon: ClipboardCheck,
        iconColor: 'text-blue-600',
        iconBackground: 'bg-blue-100',
    },
    {
        title: 'Active Schedules',
        value: '24',
        description: 'Classes scheduled today',
        icon: CalendarCheck,
        iconColor: 'text-amber-600',
        iconBackground: 'bg-amber-100',
    },
];

const systemFeatures = [
    {
        title: 'GPS Location Tracking',
        icon: MapPin,
    },
    {
        title: 'Automatic Attendance',
        icon: UserCheck,
    },
    {
        title: 'Secure Authentication',
        icon: ShieldCheck,
    },
];

export default function Welcome({
    canRegister = true,
}: WelcomeProps) {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;

    const dashboardUrl =
        user?.role === 'admin'
            ? '/admin/dashboard'
            : user?.role === 'student'
              ? '/student/dashboard'
              : user?.role === 'instructor'
                ? '/dashboard'
                : '/';

    return (
        <>
            <Head title="PSU Attendance" />

            <div className="min-h-screen bg-[#970027] text-white [color-scheme:light]">
                {/* Decorative background */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-white/[0.04]" />
                    <div className="absolute -bottom-64 -left-40 h-[550px] w-[550px] rounded-full bg-[#ffd600]/[0.06]" />
                </div>

                <main className="relative mx-auto flex min-h-screen max-w-[1500px] items-center px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
                    <div className="grid w-full items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] xl:gap-16">

                        {/* LEFT SECTION */}
                        <section>
                            {/* Logo */}
                            <Link
                                href="/"
                                className="mb-12 inline-flex items-center gap-4"
                            >
                                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ffd600] text-[#970027] shadow-lg shadow-black/10">
                                    <MapPin
                                        className="h-8 w-8"
                                        strokeWidth={2.5}
                                    />
                                </span>

                                <span>
                                    <span className="block text-xl font-bold leading-tight text-white">
                                        PSU Attendance
                                    </span>

                                    <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-[#f5a8ba]">
                                        Attendance Monitoring System
                                    </span>
                                </span>
                            </Link>

                            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-[#ffd7e1]">
                                <span className="h-2 w-2 rounded-full bg-[#ffd600]" />
                                Pampanga State University – Lubao Campus
                            </div>

                            <h1 className="max-w-3xl text-4xl font-bold leading-[1.12] text-white sm:text-5xl xl:text-6xl">
                                Automated Student Attendance
                                <span className="text-[#ffd600]">
                                    {' '}
                                    and Location Tracking
                                </span>
                            </h1>

                            <p className="mt-7 max-w-2xl text-base leading-8 text-[#f5c2cf] sm:text-lg">
                                A secure GPS-based system designed to simplify
                                attendance monitoring for students and
                                instructors using real-time location
                                verification.
                            </p>

                            {/* Features */}
                            <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                {systemFeatures.map((feature) => {
                                    const Icon = feature.icon;

                                    return (
                                        <div
                                            key={feature.title}
                                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3"
                                        >
                                            <Icon
                                                className="h-5 w-5 shrink-0 text-[#ffd600]"
                                                strokeWidth={2}
                                            />

                                            <span className="text-sm font-medium text-white">
                                                {feature.title}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* LOGIN / REGISTER / DASHBOARD BUTTONS */}
                            <div className="mt-9 flex flex-wrap gap-4">
                                {!user ? (
                                    <>
                                        <Link
                                            href={login()}
                                            className="inline-flex min-h-13 items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-base font-bold text-[#970027] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-gray-100"
                                        >
                                            Log in
                                            <ArrowRight className="h-5 w-5" />
                                        </Link>

                                        {canRegister && (
                                            <Link
                                                href={register()}
                                                className="inline-flex min-h-13 items-center justify-center rounded-2xl border border-white/30 bg-transparent px-8 py-4 text-base font-bold text-white transition hover:bg-white/10"
                                            >
                                                Register
                                            </Link>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href={dashboardUrl}
                                        className="inline-flex min-h-13 items-center justify-center gap-3 rounded-2xl bg-white px-7 py-4 text-base font-bold text-[#970027] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-gray-100"
                                    >
                                        Go to Dashboard
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>
                                )}
                            </div>
                        </section>

                        {/* RIGHT DASHBOARD PREVIEW */}
                        <section className="rounded-[32px] bg-white p-5 text-slate-900 shadow-2xl shadow-black/20 sm:p-7 xl:p-9">
                            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffd600] text-[#970027]">
                                            <MapPin
                                                className="h-6 w-6"
                                                strokeWidth={2.5}
                                            />
                                        </span>

                                        <div>
                                            <h2 className="text-2xl font-bold text-[#970027]">
                                                Attendance Dashboard
                                            </h2>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Campus attendance overview
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                                    GPS Tracking Active
                                </div>
                            </div>

                            {/* Statistics */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {statistics.map((statistic) => {
                                    const Icon = statistic.icon;

                                    return (
                                        <article
                                            key={statistic.title}
                                            className="rounded-2xl border border-slate-200 bg-[#f8f9fb] p-5 transition hover:border-[#970027]/30 hover:shadow-md"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-500">
                                                        {statistic.title}
                                                    </p>

                                                    <p className="mt-2 text-3xl font-bold text-slate-950">
                                                        {statistic.value}
                                                    </p>
                                                </div>

                                                <span
                                                    className={[
                                                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                                                        statistic.iconBackground,
                                                        statistic.iconColor,
                                                    ].join(' ')}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </span>
                                            </div>

                                            <p className="mt-3 text-sm text-slate-500">
                                                {statistic.description}
                                            </p>
                                        </article>
                                    );
                                })}
                            </div>

                            {/* System status */}
                            <div className="mt-5 rounded-2xl bg-[#970027] p-5 text-white">
                                <div className="mb-4 flex items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">
                                            System Status
                                        </h3>

                                        <p className="mt-1 text-sm text-[#f5b5c5]">
                                            Attendance services are operational
                                        </p>
                                    </div>

                                    <ShieldCheck className="h-7 w-7 shrink-0 text-[#ffd600]" />
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    {[
                                        'GPS Location Tracking',
                                        'Automatic Attendance',
                                        'Schedule Monitoring',
                                        'Student Verification',
                                    ].map((feature) => (
                                        <div
                                            key={feature}
                                            className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.08] px-4 py-3"
                                        >
                                            <span className="text-sm font-medium text-white">
                                                {feature}
                                            </span>

                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ffd600] text-[#970027]">
                                                <Check
                                                    className="h-4 w-4"
                                                    strokeWidth={3}
                                                />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <p className="mt-5 text-center text-xs text-slate-400">
                                PSU Attendance Monitoring System
                            </p>
                        </section>
                    </div>
                </main>
            </div>
        </>
    );
}