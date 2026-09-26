import { Head } from '@inertiajs/react';
import { CheckCircle, Clock, MapPin, QrCode, User } from 'lucide-react';

export default function StudentDashboard() {
    return (
        <>
            <Head title="Student Dashboard" />

            <div className="min-h-screen bg-[#f7f8fa] px-4 py-6 sm:px-7 sm:py-8">
                <main className="mx-auto max-w-5xl space-y-5">
                    <header className="mb-7">
                        <h1 className="text-3xl font-bold text-[#850027]">
                            Student Home
                        </h1>
                        <p className="mt-1 text-gray-600">
                            Your classes and attendance at a glance
                        </p>
                    </header>
                    {/* STUDENT PROFILE */}
                    <section className="flex items-center gap-3 rounded-3xl bg-[#fff4f6] p-4 shadow-sm sm:p-5">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f7dce4] text-[#850027]">
                            <User />
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs text-gray-600">
                                GOOD MORNING
                            </p>

                            <h2 className="truncate text-lg font-bold sm:text-xl">
                                Juan dela Cruz
                            </h2>

                            <p className="text-sm">BSIT 3-A • STU-2024-0042</p>
                        </div>
                    </section>
                    {/* ATTENDANCE CONFIRMED */}
                    <section className="flex flex-col justify-between gap-4 rounded-3xl border border-green-200 bg-[#eafff4] p-4 sm:flex-row sm:p-5">
                        <div className="flex items-start gap-3">
                            <CheckCircle
                                className="shrink-0 text-green-600"
                                size={35}
                            />

                            <div>
                                <h3 className="font-bold text-green-700">
                                    Attendance Confirmed
                                </h3>

                                <p className="text-sm">
                                    You're within the classroom geofence
                                </p>
                            </div>
                        </div>

                        <span className="self-start rounded-full border border-green-400 px-3 py-2 text-xs text-green-700">
                            ⏱ 12h 33m
                        </span>
                    </section>
                    {/* STATISTICS */}
                    <section className="grid grid-cols-3 gap-2 sm:gap-3">
                        <Stat
                            value="5/5"
                            label="This Week"
                            color="text-green-600"
                        />

                        <Stat
                            value="18/20"
                            label="This Month"
                            color="text-[#850027]"
                        />

                        <Stat
                            value="94%"
                            label="Overall"
                            color="text-[#850027]"
                        />
                    </section>
                    {/* CURRENT CLASS */}
                    <section className="rounded-3xl bg-white p-5 shadow">
                        <p className="text-xs font-bold text-[#850027]">
                            NOW IN SESSION
                        </p>

                        <h2 className="mt-2 text-lg font-bold sm:text-xl">
                            IT 301 — Web Systems
                        </h2>

                        <div className="mt-4 space-y-3 text-sm">
                            <Info
                                icon={<Clock size={18} />}
                                text="08:00 AM – 09:30 AM"
                            />

                            <Info
                                icon={<MapPin size={18} />}
                                text="IT Building – Room 302"
                            />

                            <Info
                                icon={<User size={18} />}
                                text="Prof. Sarah Chen"
                            />
                        </div>

                        <hr className="my-4" />

                        <div className="flex justify-between text-sm font-semibold">
                            <span>⏱ Time in class</span>

                            <span className="text-[#850027]">12h 33m</span>
                        </div>

                        <div className="mt-3 h-2 rounded-full bg-[#850027]" />

                        <div className="mt-2 flex justify-between text-xs">
                            <span>Check-in: 8:02 AM</span>

                            <span>Ends: 9:30 AM</span>
                        </div>
                    </section>
                    <section className="flex items-center justify-between rounded-3xl bg-white p-4 shadow sm:p-5">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="shrink-0 rounded-full bg-green-100 p-3 text-green-600">
                                📡
                            </div>

                            <div className="min-w-0">
                                <h3 className="text-lg font-bold">
                                    GPS Tracking
                                </h3>

                                <p className="text-xs break-all sm:text-sm">
                                    15.0794° N, 120.6200° E
                                </p>
                            </div>
                        </div>

                        {/* Toggle */}

                        <div className="h-8 w-14 shrink-0 rounded-full bg-green-500 p-1">
                            <div className="ml-auto h-6 w-6 rounded-full bg-white" />
                        </div>
                    </section>
                    {/* STUDENT QR CODE */}
                    <section className="flex items-center justify-between rounded-3xl bg-white p-5 shadow">
                        <div className="flex items-center gap-4">
                            <div className="rounded-full bg-[#fff0f3] p-3 text-[#850027]">
                                <QrCode />
                            </div>

                            <div>
                                <h3 className="font-bold">
                                    Student ID QR Code
                                </h3>

                                <p className="text-sm text-gray-600">
                                    For manual guard verification
                                </p>
                            </div>
                        </div>

                        <span className="text-xl">›</span>
                    </section>
                </main>
            </div>
        </>
    );
}

// =================================
// STAT CARD
// =================================

function Stat({
    value,
    label,
    color,
}: {
    value: string;
    label: string;
    color: string;
}) {
    return (
        <div className="rounded-2xl bg-white p-3 text-center shadow sm:p-4">
            <h2 className={`text-xl font-bold sm:text-2xl ${color} `}>
                {value}
            </h2>

            <p className="text-xs sm:text-sm">{label}</p>
        </div>
    );
}

// =================================
// INFORMATION ROW
// =================================

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-3">
            {icon}

            <span>{text}</span>
        </div>
    );
}
