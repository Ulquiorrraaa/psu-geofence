import { Head, usePage } from '@inertiajs/react';
import { Clock3, MapPin, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';

type Schedule = {
    id: number;
    subject: string;
    section: string | null;
    instructor: string;
    start_time: string;
    end_time: string;
    location: string;
    days: string[];
};

type PageProps = {
    schedules?: Schedule[];
};

/*
|--------------------------------------------------------------------------
| Days
|--------------------------------------------------------------------------
|
| Supports Monday to Sunday.
|
*/

const DAYS = [
    {
        short: 'Mon',
        full: 'Monday',
    },
    {
        short: 'Tue',
        full: 'Tuesday',
    },
    {
        short: 'Wed',
        full: 'Wednesday',
    },
    {
        short: 'Thu',
        full: 'Thursday',
    },
    {
        short: 'Fri',
        full: 'Friday',
    },
    {
        short: 'Sat',
        full: 'Saturday',
    },
    {
        short: 'Sun',
        full: 'Sunday',
    },
];

export default function StudentSchedules() {
    const { schedules = [] } = usePage().props as unknown as PageProps;

    /*
    |--------------------------------------------------------------------------
    | Current Day
    |--------------------------------------------------------------------------
    */

    const todayName = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: 'Asia/Manila',
    });

    /*
    |--------------------------------------------------------------------------
    | Default Selected Day
    |--------------------------------------------------------------------------
    |
    | Automatically opens today's day.
    |
    | Example:
    |
    | Saturday -> Sat
    | Sunday   -> Sun
    |
    */

    const defaultDay =
        DAYS.find((day) => day.full === todayName)?.short ?? 'Mon';

    const [selectedDay, setSelectedDay] = useState(defaultDay);

    /*
    |--------------------------------------------------------------------------
    | Normalize Day
    |--------------------------------------------------------------------------
    |
    | Supports both:
    |
    | Mon / Monday
    | Tue / Tuesday
    | ...
    | Sat / Saturday
    | Sun / Sunday
    |
    */

    const normalizeDay = (day: string) => {
        const value = day.trim().toLowerCase();

        const aliases: Record<string, string> = {
            monday: 'Mon',
            mon: 'Mon',
            m: 'Mon',

            tuesday: 'Tue',
            tue: 'Tue',
            tues: 'Tue',

            wednesday: 'Wed',
            wed: 'Wed',
            w: 'Wed',

            thursday: 'Thu',
            thu: 'Thu',
            thur: 'Thu',
            thurs: 'Thu',

            friday: 'Fri',
            fri: 'Fri',
            f: 'Fri',

            saturday: 'Sat',
            sat: 'Sat',

            sunday: 'Sun',
            sun: 'Sun',
        };

        return aliases[value] ?? day;
    };

    /*
    |--------------------------------------------------------------------------
    | Selected Day Information
    |--------------------------------------------------------------------------
    */

    const selectedDayInfo =
        DAYS.find((day) => day.short === selectedDay) ?? DAYS[0];

    /*
    |--------------------------------------------------------------------------
    | Filter Schedule
    |--------------------------------------------------------------------------
    */

    const filteredSchedules = useMemo(() => {
        return schedules
            .filter((schedule) => {
                if (!Array.isArray(schedule.days)) {
                    return false;
                }

                return schedule.days.some(
                    (day) => normalizeDay(day) === selectedDay,
                );
            })
            .sort(
                (a, b) =>
                    timeToMinutes(a.start_time) - timeToMinutes(b.start_time),
            );
    }, [schedules, selectedDay]);

    /*
    |--------------------------------------------------------------------------
    | Format Time
    |--------------------------------------------------------------------------
    */

    const formatTime = (time?: string) => {
        if (!time) {
            return 'Time not set';
        }

        try {
            const cleanTime = time.substring(0, 5);

            const [hourString, minute] = cleanTime.split(':');

            let hour = Number(hourString);

            const period = hour >= 12 ? 'PM' : 'AM';

            hour = hour % 12 || 12;

            return `${hour.toString().padStart(2, '0')}:${minute} ${period}`;
        } catch {
            return time;
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Convert Time to Minutes
    |--------------------------------------------------------------------------
    */

    function timeToMinutes(time?: string) {
        if (!time) {
            return 0;
        }

        const [hours, minutes] = time.substring(0, 5).split(':').map(Number);

        return hours * 60 + minutes;
    }

    /*
    |--------------------------------------------------------------------------
    | Schedule Status
    |--------------------------------------------------------------------------
    */

    const getScheduleStatus = (schedule: Schedule) => {
        const isToday = selectedDayInfo.full === todayName;

        /*
         * If user is viewing another day,
         * class is considered upcoming.
         */

        if (!isToday) {
            return 'upcoming';
        }

        /*
        |--------------------------------------------------------------------------
        | Philippine Current Time
        |--------------------------------------------------------------------------
        */

        const now = new Date();

        const manilaTime = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Manila',

            hour: '2-digit',

            minute: '2-digit',

            hour12: false,
        }).format(now);

        const [currentHour, currentMinute] = manilaTime.split(':').map(Number);

        const currentMinutes = currentHour * 60 + currentMinute;

        const startMinutes = timeToMinutes(schedule.start_time);

        const endMinutes = timeToMinutes(schedule.end_time);

        if (currentMinutes > endMinutes) {
            return 'done';
        }

        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
            return 'now';
        }

        return 'upcoming';
    };

    /*
    |--------------------------------------------------------------------------
    | Status Design
    |--------------------------------------------------------------------------
    */

    const statusConfig = {
        done: {
            text: 'Done',

            cardBorder: 'border-t-4 border-t-emerald-500',

            badge: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
        },

        now: {
            text: 'Now',

            cardBorder: 'border-t-4 border-t-[#980026]',

            badge: 'border border-rose-200 bg-rose-50 text-[#980026]',
        },

        upcoming: {
            text: 'Upcoming',

            cardBorder: 'border-t-4 border-t-[#980026]',

            badge: 'border border-gray-200 bg-gray-50 text-gray-600',
        },
    };

    return (
        <>
            <Head title="My Schedule" />

            <div className="min-h-full bg-[#f5f6f8] px-4 py-6 sm:px-6 lg:px-7">
                <div className="w-full min-w-0">
                    {/* =====================================================
                        MAIN SCHEDULE CONTAINER
                    ===================================================== */}

                    <section className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm">
                        {/* =================================================
                            DAY TABS
                        ================================================= */}

                        <div className="grid grid-cols-4 gap-2 border-b border-gray-200 px-5 py-4 sm:grid-cols-7 sm:px-6">
                            {DAYS.map((day) => {
                                const active = selectedDay === day.short;

                                return (
                                    <button
                                        key={day.short}
                                        type="button"
                                        onClick={() =>
                                            setSelectedDay(day.short)
                                        }
                                        className={`relative flex min-h-[50px] items-center justify-center rounded-[20px] px-3 text-sm font-semibold transition-all duration-200 sm:text-[15px] ${
                                            active
                                                ? 'bg-[#980026] text-white shadow-sm'
                                                : 'bg-transparent text-black hover:bg-gray-50'
                                        } `}
                                    >
                                        <span>{day.short}</span>

                                        {active && (
                                            <span className="absolute bottom-[8px] h-[5px] w-[5px] rounded-full bg-[#e9b6c4]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* =================================================
                            SCHEDULE CONTENT
                        ================================================= */}

                        <div className="px-5 pt-5 pb-5 sm:px-6">
                            {/* DAY TITLE */}

                            <div className="mb-3">
                                <h2 className="text-[15px] font-bold tracking-[0.08em] text-black uppercase sm:text-base">
                                    {selectedDayInfo.full}

                                    {selectedDayInfo.full === todayName && (
                                        <>
                                            {' '}
                                            <span>· TODAY</span>
                                        </>
                                    )}
                                </h2>

                                <p className="mt-1 text-[16px] text-black sm:text-[17px]">
                                    {filteredSchedules.length}{' '}
                                    {filteredSchedules.length === 1
                                        ? 'class scheduled'
                                        : 'classes scheduled'}
                                </p>
                            </div>

                            {/* =================================================
                                CLASS CARDS
                            ================================================= */}

                            {filteredSchedules.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredSchedules.map((schedule) => {
                                        const status =
                                            getScheduleStatus(schedule);

                                        const config = statusConfig[status];

                                        return (
                                            <article
                                                key={schedule.id}
                                                className={`overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm ${config.cardBorder} `}
                                            >
                                                <div className="relative px-5 py-5 sm:px-6">
                                                    {/* STATUS */}

                                                    <span
                                                        className={`absolute top-5 right-5 rounded-full px-3 py-1 text-xs font-medium sm:right-6 ${config.badge} `}
                                                    >
                                                        {config.text}
                                                    </span>

                                                    {/* SUBJECT */}

                                                    <div className="pr-24">
                                                        <h3 className="text-[16px] font-bold text-black sm:text-[17px]">
                                                            {schedule.subject}
                                                        </h3>

                                                        {schedule.section && (
                                                            <p className="mt-1 text-sm text-gray-500">
                                                                Section{' '}
                                                                {
                                                                    schedule.section
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* DETAILS */}

                                                    <div className="mt-4 space-y-2 text-[14px] text-black sm:text-[15px]">
                                                        {/* TIME */}

                                                        <div className="flex items-center gap-3">
                                                            <Clock3
                                                                size={18}
                                                                strokeWidth={
                                                                    1.8
                                                                }
                                                                className="shrink-0 text-black"
                                                            />

                                                            <span>
                                                                {formatTime(
                                                                    schedule.start_time,
                                                                )}

                                                                {' – '}

                                                                {formatTime(
                                                                    schedule.end_time,
                                                                )}
                                                            </span>
                                                        </div>

                                                        {/* LOCATION */}

                                                        <div className="flex items-center gap-3">
                                                            <MapPin
                                                                size={18}
                                                                strokeWidth={
                                                                    1.8
                                                                }
                                                                className="shrink-0 text-black"
                                                            />

                                                            <span>
                                                                {schedule.location ||
                                                                    'Location not set'}
                                                            </span>
                                                        </div>

                                                        {/* INSTRUCTOR */}

                                                        <div className="flex items-center gap-3">
                                                            <UserRound
                                                                size={18}
                                                                strokeWidth={
                                                                    1.8
                                                                }
                                                                className="shrink-0 text-black"
                                                            />

                                                            <span>
                                                                {schedule.instructor ||
                                                                    'Instructor not set'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* =============================================
                                    EMPTY DAY
                                ============================================= */

                                <div className="flex min-h-[180px] items-center justify-center rounded-[18px] border border-dashed border-gray-300 bg-gray-50">
                                    <div className="text-center">
                                        <p className="font-semibold text-gray-700">
                                            No classes scheduled
                                        </p>

                                        <p className="mt-1 text-sm text-gray-500">
                                            You don't have any classes on{' '}
                                            {selectedDayInfo.full}.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
