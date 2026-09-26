import { Head } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    Download,
    Filter,
    Minus,
    Plus,
    Settings,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type AttendanceStatus = 'present_gps' | 'present_manual' | 'late' | 'absent';

interface Student {
    id: number;
    student_id: string;
    name: string;
    year: string;
    section: string;
}

interface Subject {
    id: number;
    name: string;
}

interface AttendanceRecord {
    student_id: number;
    date: string;
    status: AttendanceStatus;
}

interface Props {
    students?: Student[];
    subjects?: Subject[];
    attendance?: AttendanceRecord[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Attendance({
    students = [],
    subjects = [],
    attendance = [],
}: Props) {
    const [showSettings, setShowSettings] = useState(true);

    const [weeks, setWeeks] = useState(4);
    const [daysPerWeek, setDaysPerWeek] = useState(6);

    const [startDate, setStartDate] = useState('2026-05-05');

    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    const [records, setRecords] = useState<Record<string, AttendanceStatus>>(
        () => {
            const result: Record<string, AttendanceStatus> = {};

            attendance.forEach((item) => {
                result[`${item.student_id}-${item.date}`] = item.status;
            });

            return result;
        },
    );

    /**
     * Get the Monday for whatever start date was selected.
     */
    const normalizedStartDate = useMemo(() => {
        const date = new Date(`${startDate}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return new Date();
        }

        const day = date.getDay();

        const difference =
            day === 0
                ? -6
                : 1 - day;

        const monday = new Date(date);

        monday.setDate(date.getDate() + difference);

        return monday;
    }, [startDate]);

    /**
     * Generates Week 1, Week 2, etc.
     */
    const generatedWeeks = useMemo(() => {
        return Array.from({ length: weeks }, (_, weekIndex) => {
            return Array.from({ length: daysPerWeek }, (_, dayIndex) => {
                const date = new Date(normalizedStartDate);

                date.setDate(
                    normalizedStartDate.getDate() +
                        weekIndex * 7 +
                        dayIndex,
                );

                return {
                    day: DAYS[dayIndex],
                    date,
                    dateKey: formatDateKey(date),
                    displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
                };
            });
        });
    }, [weeks, daysPerWeek, normalizedStartDate]);

    /**
     * Available year filters.
     */
    const years = useMemo(() => {
        return Array.from(
            new Set(students.map((student) => student.year).filter(Boolean)),
        );
    }, [students]);

    /**
     * Available section filters.
     */
    const sections = useMemo(() => {
        return Array.from(
            new Set(
                students.map((student) => student.section).filter(Boolean),
            ),
        );
    }, [students]);

    /**
     * Filter students.
     */
    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const matchesYear =
                !selectedYear || student.year === selectedYear;

            const matchesSection =
                !selectedSection || student.section === selectedSection;

            return matchesYear && matchesSection;
        });
    }, [students, selectedYear, selectedSection]);

    /**
     * Attendance totals.
     */
    const summary = useMemo(() => {
        let present = 0;
        let late = 0;
        let absent = 0;
        let gps = 0;

        Object.values(records).forEach((status) => {
            if (
                status === 'present_gps' ||
                status === 'present_manual'
            ) {
                present++;
            }

            if (status === 'present_gps') {
                gps++;
            }

            if (status === 'late') {
                late++;
            }

            if (status === 'absent') {
                absent++;
            }
        });

        return {
            present,
            late,
            absent,
            gps,
        };
    }, [records]);

    /**
     * Change attendance status when clicking a cell.
     *
     * Order:
     * Empty -> Manual Present -> Late -> Absent -> Empty
     *
     * GPS attendance should normally be recorded automatically
     * by your GPS/geofence backend.
     */
    const toggleAttendance = (student: Student, date: string) => {
        const key = `${student.id}-${date}`;
        const current = records[key];

        let nextStatus: AttendanceStatus | null = null;

        if (!current) {
            nextStatus = 'present_manual';
        } else if (current === 'present_manual') {
            nextStatus = 'late';
        } else if (current === 'late') {
            nextStatus = 'absent';
        } else if (current === 'absent') {
            nextStatus = null;
        } else if (current === 'present_gps') {
            // Prevent manual modification of GPS attendance.
            return;
        }

        setRecords((previous) => {
            const updated = { ...previous };

            if (nextStatus === null) {
                delete updated[key];
            } else {
                updated[key] = nextStatus;
            }

            return updated;
        });

        /**
         * Uncomment this once the attendance.store route
         * from the backend section below has been added.
         */

        /*
        router.post(
            '/attendance/mark',
            {
                student_id: student.id,
                date,
                status: nextStatus,
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
        */
    };

    const applyPreset = (presetWeeks: number, presetDays: number) => {
        setWeeks(presetWeeks);
        setDaysPerWeek(presetDays);
    };

    /**
     * Excel-compatible CSV export.
     */
    const exportAttendance = () => {
        const headers = ['Student ID', 'Name', 'Year', 'Section'];

        generatedWeeks.forEach((week, weekIndex) => {
            week.forEach((day) => {
                headers.push(
                    `Week ${weekIndex + 1} ${day.day} ${day.displayDate}`,
                );
            });
        });

        const rows = filteredStudents.map((student) => {
            const basic = [
                student.student_id,
                student.name,
                student.year,
                student.section,
            ];

            generatedWeeks.forEach((week) => {
                week.forEach((day) => {
                    const status =
                        records[`${student.id}-${day.dateKey}`];

                    basic.push(attendanceText(status));
                });
            });

            return basic;
        });

        const csv = [headers, ...rows]
            .map((row) =>
                row
                    .map((cell) => {
                        const value = String(cell ?? '').replace(/"/g, '""');

                        return `"${value}"`;
                    })
                    .join(','),
            )
            .join('\n');

        const blob = new Blob([csv], {
            type: 'text/csv;charset=utf-8;',
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;
        link.download = 'attendance-sheet.csv';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    return (
        <>
            <Head title="Attendance Sheet" />

            <div className="min-h-screen bg-[#f6f7f9] text-slate-900 [color-scheme:light]">
                {/* Top GPS status */}
                <div className="flex h-[54px] items-center justify-end border-b border-gray-200 bg-white px-8 shadow-sm">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

                        GPS Tracking Active
                    </div>
                </div>

                <main className="p-7 lg:p-8">
                    {/* Heading */}
                    <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-[#900027]">
                                Attendance Sheet
                            </h1>

                            <p className="mt-1 text-lg text-gray-800">
                                Mark and track student attendance by week
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowSettings(!showSettings)
                                }
                                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                                <Settings size={20} />

                                {showSettings
                                    ? 'Hide Settings'
                                    : 'Show Settings'}
                            </button>

                            <button
                                type="button"
                                onClick={exportAttendance}
                                className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-green-700"
                            >
                                <Download size={20} />

                                Export to Excel
                            </button>
                        </div>
                    </div>

                    {/* SETTINGS */}
                    {showSettings && (
                        <section className="mb-7 rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <Settings size={24} />

                                <h2 className="text-xl font-bold text-slate-900">
                                    Sheet Configuration
                                </h2>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-3">
                                {/* Number of weeks */}
                                <div>
                                    <label className="mb-2 block font-medium text-slate-700">
                                        Number of Weeks
                                    </label>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setWeeks((current) =>
                                                    Math.max(1, current - 1),
                                                )
                                            }
                                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-slate-600 transition hover:bg-gray-200"
                                        >
                                            <Minus size={20} />
                                        </button>

                                        <div className="flex h-12 flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white text-lg text-slate-900">
                                            {weeks}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setWeeks((current) =>
                                                    Math.min(12, current + 1),
                                                )
                                            }
                                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-slate-600 transition hover:bg-gray-200"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Max: 12 weeks
                                    </p>
                                </div>

                                {/* Days per week */}
                                <div>
                                    <label className="mb-2 block font-medium text-slate-700">
                                        Days Per Week
                                    </label>

                                    <select
                                        value={daysPerWeek}
                                        onChange={(event) =>
                                            setDaysPerWeek(
                                                Number(event.target.value),
                                            )
                                        }
                                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-slate-900 outline-none [color-scheme:light] focus:border-blue-500"
                                    >
                                        <option value={5}>
                                            5 days (Mon-Fri)
                                        </option>

                                        <option value={6}>
                                            6 days (Mon-Sat)
                                        </option>
                                    </select>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Current:{' '}
                                        {DAYS.slice(0, daysPerWeek).join(', ')}
                                    </p>
                                </div>

                                {/* Start date */}
                                <div>
                                    <label className="mb-2 block font-medium text-slate-700">
                                        Start Date
                                    </label>

                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(event) =>
                                            setStartDate(event.target.value)
                                        }
                                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-slate-900 outline-none [color-scheme:light] focus:border-blue-500"
                                    />

                                    <p className="mt-2 text-sm text-slate-500">
                                        First Monday of the sheet
                                    </p>
                                </div>
                            </div>

                            <div className="my-7 border-t border-gray-200" />

                            <p className="mb-3 font-medium text-slate-700">
                                Quick Presets:
                            </p>

                            <div className="flex flex-wrap gap-3">
                                <PresetButton
                                    text="4 Weeks, 5 Days"
                                    onClick={() => applyPreset(4, 5)}
                                />

                                <PresetButton
                                    text="4 Weeks, 6 Days"
                                    onClick={() => applyPreset(4, 6)}
                                />

                                <PresetButton
                                    text="8 Weeks, 5 Days"
                                    onClick={() => applyPreset(8, 5)}
                                />

                                <PresetButton
                                    text="12 Weeks, 6 Days (Full Semester)"
                                    onClick={() => applyPreset(12, 6)}
                                />
                            </div>
                        </section>
                    )}

                    {/* FILTER */}
                    <section className="mb-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 font-medium text-slate-600">
                                <Filter size={22} className="text-slate-400" />

                                Filters:
                            </div>

                            <select
                                value={selectedSubject}
                                onChange={(event) =>
                                    setSelectedSubject(event.target.value)
                                }
                                className="h-12 min-w-[240px] rounded-xl border border-gray-300 bg-white px-4 text-slate-900 [color-scheme:light]"
                            >
                                <option value="">All Classes</option>

                                {subjects.map((subject) => (
                                    <option
                                        key={subject.id}
                                        value={subject.id}
                                    >
                                        {subject.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedYear}
                                onChange={(event) =>
                                    setSelectedYear(event.target.value)
                                }
                                className="h-12 min-w-[150px] rounded-xl border border-gray-300 bg-white px-4 text-slate-900 [color-scheme:light]"
                            >
                                <option value="">All Years</option>

                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedSection}
                                onChange={(event) =>
                                    setSelectedSection(event.target.value)
                                }
                                className="h-12 min-w-[180px] rounded-xl border border-gray-300 bg-white px-4 text-slate-900 [color-scheme:light]"
                            >
                                <option value="">All Sections</option>

                                {sections.map((section) => (
                                    <option
                                        key={section}
                                        value={section}
                                    >
                                        {section}
                                    </option>
                                ))}
                            </select>

                            <div className="ml-auto flex items-center gap-3 text-slate-600">
                                <CalendarDays size={20} />

                                <span>
                                    {normalizedStartDate.toLocaleString(
                                        'en-US',
                                        {
                                            month: 'long',
                                            year: 'numeric',
                                        },
                                    )}
                                </span>

                                <span className="rounded-full bg-blue-100 px-4 py-2 font-medium text-blue-700">
                                    {weeks} Weeks × {daysPerWeek} Days
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* LEGEND */}
                    <section className="mb-7 rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
                        <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
                            <Legend
                                type="present"
                                text="Present (GPS Auto-recorded)"
                            />

                            <Legend
                                type="manual"
                                text="Present (Manual)"
                            />

                            <Legend
                                type="late"
                                text="Late"
                            />

                            <Legend
                                type="absent"
                                text="Absent"
                            />
                        </div>
                    </section>

                    {/* ATTENDANCE TABLE */}
                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-max border-collapse text-slate-900">
                                <thead>
                                    <tr className="bg-[#ffc400] text-slate-950">
                                        <th className="sticky left-0 z-30 min-w-[250px] border-r-2 border-black bg-[#ffc400] px-5 py-4 text-left text-xl">
                                            Name
                                        </th>

                                        {generatedWeeks.map(
                                            (week, weekIndex) => (
                                                <th
                                                    key={weekIndex}
                                                    colSpan={week.length}
                                                    className="border-r-2 border-black px-5 py-4 text-center text-xl font-bold last:border-r-0"
                                                >
                                                    Week {weekIndex + 1}
                                                </th>
                                            ),
                                        )}
                                    </tr>

                                    <tr className="bg-[#ffe01b] text-slate-950">
                                        <th className="sticky left-0 z-30 border-r-2 border-black bg-[#ffe01b] px-5 py-3 text-left text-base">
                                            Student ID
                                        </th>

                                        {generatedWeeks.flatMap(
                                            (week, weekIndex) =>
                                                week.map((day) => (
                                                    <th
                                                        key={`${weekIndex}-${day.dateKey}`}
                                                        className="min-w-[52px] border-r border-gray-300 px-2 py-2 text-center"
                                                    >
                                                        <div className="text-sm font-bold">
                                                            {day.day}
                                                        </div>

                                                        <div className="text-xs font-medium text-slate-600">
                                                            {
                                                                day.displayDate
                                                            }
                                                        </div>
                                                    </th>
                                                )),
                                        )}
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    weeks * daysPerWeek + 1
                                                }
                                                className="bg-white px-6 py-14 text-center text-slate-600"
                                            >
                                                <div className="text-lg font-medium">
                                                    No students found.
                                                </div>

                                                <p className="mt-1 text-sm">
                                                    Students assigned to this
                                                    class will appear here.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <tr
                                                key={student.id}
                                                className="border-b border-gray-300 last:border-b-0"
                                            >
                                                <td className="sticky left-0 z-20 border-r-2 border-black bg-white px-5 py-4">
                                                    <div className="text-lg font-medium text-black">
                                                        {student.name}
                                                    </div>

                                                    <div className="text-sm text-slate-600">
                                                        {student.student_id}
                                                    </div>

                                                    <div className="mt-2 flex gap-2">
                                                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-slate-600">
                                                            {student.year}
                                                        </span>

                                                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-slate-600">
                                                            {student.section}
                                                        </span>
                                                    </div>
                                                </td>

                                                {generatedWeeks.flatMap(
                                                    (week) =>
                                                        week.map((day) => {
                                                            const key = `${student.id}-${day.dateKey}`;
                                                            const status =
                                                                records[key];

                                                            return (
                                                                <td
                                                                    key={key}
                                                                    onClick={() =>
                                                                        toggleAttendance(
                                                                            student,
                                                                            day.dateKey,
                                                                        )
                                                                    }
                                                                    className="h-[90px] min-w-[52px] cursor-pointer border-r border-gray-300 bg-[#f6f7f9] text-center transition hover:bg-blue-50"
                                                                >
                                                                    <AttendanceIcon
                                                                        status={
                                                                            status
                                                                        }
                                                                    />
                                                                </td>
                                                            );
                                                        }),
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* SUMMARY */}
                    <section className="mt-7 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-6 text-xl font-bold text-slate-900">
                            Attendance Summary
                        </h2>

                        <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
                            <SummaryItem
                                value={summary.present}
                                label="Present"
                                valueClass="text-green-600"
                            />

                            <SummaryItem
                                value={summary.late}
                                label="Late"
                                valueClass="text-amber-600"
                            />

                            <SummaryItem
                                value={summary.absent}
                                label="Absent"
                                valueClass="text-red-600"
                            />

                            <SummaryItem
                                value={summary.gps}
                                label="GPS Auto-recorded"
                                valueClass="text-blue-600"
                            />
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}

/* -------------------------------------
   SMALL COMPONENTS
-------------------------------------- */

function PresetButton({
    text,
    onClick,
}: {
    text: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-xl bg-gray-100 px-5 py-3 font-medium text-slate-600 transition hover:bg-gray-200"
        >
            {text}
        </button>
    );
}

function Legend({
    type,
    text,
}: {
    type: 'present' | 'manual' | 'late' | 'absent';
    text: string;
}) {
    return (
        <div className="flex items-center gap-2 text-slate-600">
            {type === 'present' && (
                <CheckCircle2
                    size={25}
                    className="text-green-600"
                />
            )}

            {type === 'manual' && (
                <CheckCircle2
                    size={25}
                    className="text-emerald-500"
                />
            )}

            {type === 'late' && (
                <Clock3
                    size={25}
                    className="text-amber-500"
                />
            )}

            {type === 'absent' && (
                <XCircle
                    size={25}
                    className="text-red-500"
                />
            )}

            <span>{text}</span>
        </div>
    );
}

function AttendanceIcon({
    status,
}: {
    status?: AttendanceStatus;
}) {
    if (status === 'present_gps') {
        return (
            <CheckCircle2
                size={29}
                className="mx-auto text-green-600"
            />
        );
    }

    if (status === 'present_manual') {
        return (
            <CheckCircle2
                size={29}
                className="mx-auto text-emerald-500"
            />
        );
    }

    if (status === 'late') {
        return (
            <Clock3
                size={29}
                className="mx-auto text-amber-500"
            />
        );
    }

    if (status === 'absent') {
        return (
            <XCircle
                size={29}
                className="mx-auto text-red-500"
            />
        );
    }

    return <span className="text-gray-400">-</span>;
}

function SummaryItem({
    value,
    label,
    valueClass,
}: {
    value: number;
    label: string;
    valueClass: string;
}) {
    return (
        <div>
            <div className={`text-3xl font-bold ${valueClass}`}>
                {value}
            </div>

            <div className="mt-2 text-slate-600">
                {label}
            </div>
        </div>
    );
}

function attendanceText(status?: AttendanceStatus) {
    switch (status) {
        case 'present_gps':
            return 'Present - GPS';

        case 'present_manual':
            return 'Present - Manual';

        case 'late':
            return 'Late';

        case 'absent':
            return 'Absent';

        default:
            return '';
    }
}

function formatDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}