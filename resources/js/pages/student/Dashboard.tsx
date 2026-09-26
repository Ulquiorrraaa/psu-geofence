import { Head } from '@inertiajs/react';
import {
    Bell,
    CalendarDays,
    CheckCircle,
    Clock,
    MapPin,
    QrCode,
    User,
    ClipboardList,
    Home,
} from 'lucide-react';

export default function StudentDashboard() {
    return (
        <>
            <Head title="Student Dashboard" />

            <div
                className="flex min-h-screen items-center justify-center bg-[#700020] p-0 sm:p-5"
                style={{
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                {/* MOBILE APP CONTAINER */}

                <div className="relative min-h-screen w-full overflow-hidden bg-[#fafafa] shadow-2xl sm:min-h-[850px] sm:max-w-[420px] sm:rounded-[35px]">
                    {/* HEADER */}

                    <header className="sticky top-0 z-20 flex items-center justify-between bg-[#850027] px-5 py-4 text-white">
                        <h1 className="text-lg font-bold sm:text-xl">
                            PSU Attendance
                        </h1>

                        <div className="relative">
                            <Bell size={24} />

                            <span className="absolute -top-2 -right-2 rounded-full bg-yellow-400 px-1.5 text-[10px] font-bold text-black">
                                3
                            </span>
                        </div>
                    </header>

                    {/* CONTENT */}

                    <main className="space-y-4 px-4 py-5 pb-28 sm:px-5">
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

                                <p className="text-sm">
                                    BSIT 3-A • STU-2024-0042
                                </p>
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
                        // =============================== // GPS TRACKING //
                        ===============================
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

                    {/* BOTTOM NAVIGATION */}

                    <nav className="absolute right-0 bottom-0 left-0 z-30 flex justify-around border-t bg-white py-3">
                        <NavItem icon={<Home />} label="Home" active />

                        <NavItem icon={<CalendarDays />} label="Schedule" />

                        <NavItem icon={<ClipboardList />} label="Attendance" />

                        <NavItem icon={<User />} label="Profile" />
                    </nav>
                </div>
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

// =================================
// BOTTOM NAV ITEM
// =================================

function NavItem({
    icon,
    label,
    active = false,
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
}) {
    return (
        <div
            className={`flex flex-col items-center gap-1 text-xs ${
                active ? 'text-[#850027]' : 'text-black'
            } `}
        >
            {icon}

            <span>{label}</span>
        </div>
    );
}
