import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
    Check,
    CheckCircle2,
    Clock3,
    Download,
    Filter,
    Minus,
    Settings,
    Wifi,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { csvCell } from '@/lib/csv';

type AttendanceStatus = 'present_gps' | 'present_manual' | 'late' | 'absent';

interface Student {
    id: number;
    student_id: string;
    name: string;
    year: string;
    section: string;
    subject_id?: number;
}

interface Subject {
    id: number;
    name: string;
}

interface AttendanceRecord {
    student_id: number;
    schedule_id: number;
    date: string;
    status: AttendanceStatus;
    gps_locked?: boolean;
}

interface Props {
    students?: Student[];
    subjects?: Subject[];
    attendance?: AttendanceRecord[];
    today: string;
    calendar: Record<
        string,
        Record<string, 'non_class' | 'pending' | 'ongoing' | 'finished'>
    >;
}

interface DayData {
    day: string;
    date: Date;
    dateKey: string;
    displayDate: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Attendance({
    students = [],
    subjects = [],
    attendance = [],
    today,
    calendar,
}: Props) {
    /*
    |--------------------------------------------------------------------------
    | SETTINGS
    |--------------------------------------------------------------------------
    */

    const gpsLocked = useMemo(
        () =>
            new Set(
                attendance
                    .filter((record) => record.gps_locked)
                    .map(
                        (record) =>
                            `${record.schedule_id}-${record.student_id}-${record.date}`,
                    ),
            ),
        [attendance],
    );
    const saving = useRef(false);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [saveError, setSaveError] = useState('');
    const [showSettings, setShowSettings] = useState(false);

    const [weeks, setWeeks] = useState(4);

    // Screenshot uses Monday-Saturday.
    const [daysPerWeek, setDaysPerWeek] = useState(6);

    const [startDate, setStartDate] = useState(() => today);

    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */

    const [selectedSubject, setSelectedSubject] = useState<string>(
        subjects.length > 0 ? String(subjects[0].id) : '',
    );

    const [selectedYear, setSelectedYear] = useState('');

    const [selectedSection, setSelectedSection] = useState('');

    /*
    |--------------------------------------------------------------------------
    | ATTENDANCE RECORDS
    |--------------------------------------------------------------------------
    */

    const records = useMemo(() => {
        const result: Record<string, AttendanceStatus> = {};
        attendance.forEach((item) => {
            result[item.schedule_id + '-' + item.student_id + '-' + item.date] =
                item.status;
        });

        return result;
    }, [attendance]);

    useEffect(() => {
        router.reload({
            data: { sheet_start: startDate, sheet_weeks: weeks },
            only: ['attendance', 'calendar', 'today'],
        });
        const poll = router.poll(15000, {
            data: { sheet_start: startDate, sheet_weeks: weeks },
            only: ['attendance', 'calendar', 'today'],
            onBefore: () => !saving.current,
        });

        return () => poll.stop();
    }, [startDate, weeks]);

    /*
    |--------------------------------------------------------------------------
    | NORMALIZED START DATE
    |--------------------------------------------------------------------------
    |
    | Whatever date is selected, the sheet starts on Monday.
    |
    */

    const normalizedStartDate = useMemo(() => {
        const date = new Date(`${startDate}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return new Date();
        }

        const currentDay = date.getDay();

        const difference = currentDay === 0 ? -6 : 1 - currentDay;

        const monday = new Date(date);

        monday.setDate(date.getDate() + difference);

        return monday;
    }, [startDate]);

    /*
    |--------------------------------------------------------------------------
    | GENERATED WEEKS
    |--------------------------------------------------------------------------
    */

    const generatedWeeks = useMemo<DayData[][]>(() => {
        return Array.from({ length: weeks }, (_, weekIndex) => {
            return Array.from({ length: daysPerWeek }, (_, dayIndex) => {
                const date = new Date(normalizedStartDate);

                date.setDate(
                    normalizedStartDate.getDate() + weekIndex * 7 + dayIndex,
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

    /*
    |--------------------------------------------------------------------------
    | YEARS
    |--------------------------------------------------------------------------
    */

    const years = useMemo(() => {
        return Array.from(
            new Set(students.map((student) => student.year).filter(Boolean)),
        );
    }, [students]);

    /*
    |--------------------------------------------------------------------------
    | SECTIONS
    |--------------------------------------------------------------------------
    */

    const sections = useMemo(() => {
        return Array.from(
            new Set(
                students
                    .filter((student) => {
                        if (!selectedYear) {
                            return true;
                        }

                        return student.year === selectedYear;
                    })
                    .map((student) => student.section)
                    .filter(Boolean),
            ),
        );
    }, [students, selectedYear]);

    /*
    |--------------------------------------------------------------------------
    | SELECTED SUBJECT
    |--------------------------------------------------------------------------
    */

    const activeSubject = useMemo(() => {
        if (!selectedSubject) {
            return null;
        }

        return subjects.find(
            (subject) => String(subject.id) === selectedSubject,
        );
    }, [subjects, selectedSubject]);

    /*
    |--------------------------------------------------------------------------
    | FILTERED STUDENTS
    |--------------------------------------------------------------------------
    */

    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const matchesYear = !selectedYear || student.year === selectedYear;

            const matchesSection =
                !selectedSection || student.section === selectedSection;

            /*
             * If your backend sends subject_id for students,
             * the subject filter will work automatically.
             *
             * If subject_id is not sent, all students remain visible.
             */
            const matchesSubject =
                !selectedSubject ||
                String(student.subject_id) === selectedSubject;

            return matchesYear && matchesSection && matchesSubject;
        });
    }, [students, selectedSubject, selectedYear, selectedSection]);

    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    const summary = useMemo(() => {
        let present = 0;
        let late = 0;
        let absent = 0;
        let gps = 0;

        /*
         * Only count attendance belonging to visible students.
         */
        const visibleStudentIds = new Set(
            filteredStudents.map((student) => student.id),
        );

        Object.entries(records).forEach(([recordKey, status]) => {
            const studentId = Number(recordKey.split('-')[1]);

            if (
                recordKey.split('-')[0] !== selectedSubject ||
                !visibleStudentIds.has(studentId)
            ) {
                return;
            }

            if (status === 'present_gps' || status === 'present_manual') {
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
    }, [records, filteredStudents, selectedSubject]);

    /*
    |--------------------------------------------------------------------------
    | ATTENDANCE TOGGLE
    |--------------------------------------------------------------------------
    |
    | Empty
    | ↓
    | Present Manual
    | ↓
    | Late
    | ↓
    | Absent
    | ↓
    | Present Manual
    |
    | GPS attendance is protected from manual changes.
    |
    */

    const toggleAttendance = (student: Student, date: string) => {
        const key = `${selectedSubject}-${student.id}-${date}`;

        if (
            saving.current ||
            gpsLocked.has(key) ||
            !selectedSubject ||
            date > today ||
            calendar[selectedSubject]?.[date] === 'non_class'
        ) {
            return;
        }

        const current = records[key];

        let nextStatus: AttendanceStatus | null = null;

        if (!current) {
            nextStatus = 'present_manual';
        } else if (current === 'present_manual' || current === 'present_gps') {
            nextStatus = 'late';
        } else if (current === 'late') {
            nextStatus = 'absent';
        } else if (current === 'absent') {
            nextStatus = 'present_manual';
        }

        saving.current = true;
        setSavingKey(key);
        setSaveError('');
        router.post(
            '/attendance',
            {
                schedule_id: Number(selectedSubject),
                student_id: student.id,
                attendance_date: date,
                status:
                    nextStatus === 'present_manual' ? 'present' : nextStatus,
            },
            {
                preserveScroll: true,
                onError: (errors) =>
                    setSaveError(
                        Object.values(errors)[0] ??
                            'Attendance could not be saved.',
                    ),
                onFinish: () => {
                    saving.current = false;
                    setSavingKey(null);
                    router.reload({
                        data: { sheet_start: startDate, sheet_weeks: weeks },
                        only: ['attendance', 'calendar', 'today'],
                    });
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | SETTINGS PRESETS
    |--------------------------------------------------------------------------
    */

    const applyPreset = (presetWeeks: number, presetDays: number) => {
        setWeeks(presetWeeks);
        setDaysPerWeek(presetDays);
    };

    /*
    |--------------------------------------------------------------------------
    | EXPORT CSV
    |--------------------------------------------------------------------------
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
            const row: Array<string | number> = [
                student.student_id,
                student.name,
                student.year,
                student.section,
            ];

            generatedWeeks.forEach((week) => {
                week.forEach((day) => {
                    const status =
                        records[
                            `${selectedSubject}-${student.id}-${day.dateKey}`
                        ];

                    row.push(
                        calendar[selectedSubject]?.[day.dateKey] === 'non_class'
                            ? 'Non-class day'
                            : attendanceText(status),
                    );
                });
            });

            return row;
        });

        const csv = [headers, ...rows]
            .map((row) => row.map(csvCell).join(','))
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
            {saveError && (
                <p role="alert" className="p-4 text-red-700">
                    {saveError}
                </p>
            )}
            <Head title="Attendance Sheet" />

            <div className="min-h-full bg-[#f5f6f8] text-slate-900">
                {/* =====================================================
                    TOP GPS BAR
                ====================================================== */}

                <div className="sticky top-0 z-40 flex h-[58px] items-center justify-end border-b border-gray-200 bg-white px-7 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        GPS Tracking Active
                    </div>
                </div>

                {/* =====================================================
                    MAIN CONTENT
                ====================================================== */}

                <main className="px-4 pt-4 pb-8 sm:px-6 lg:px-7">
                    {/* =================================================
                        PAGE HEADER
                    ================================================== */}

                    <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <h1 className="text-[29px] font-bold tracking-tight text-[#970027]">
                                Attendance Sheet
                            </h1>

                            <p className="mt-1 text-[17px] text-slate-700">
                                Mark and track student attendance by week
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowSettings((current) => !current)
                                }
                                className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-gray-50"
                            >
                                <Settings size={18} />
                                Settings
                            </button>

                            <button
                                type="button"
                                onClick={exportAttendance}
                                className="flex h-11 items-center gap-2 rounded-xl bg-[#970027] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#7f001f]"
                            >
                                <Download size={18} />
                                Export to Excel
                            </button>
                        </div>
                    </div>

                    {/* =================================================
                        SETTINGS PANEL
                    ================================================== */}

                    {showSettings && (
                        <section className="mb-5 rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Settings
                                        size={21}
                                        className="text-[#970027]"
                                    />

                                    <div>
                                        <h2 className="font-bold text-slate-900">
                                            Sheet Configuration
                                        </h2>

                                        <p className="text-sm text-slate-500">
                                            Configure attendance weeks and class
                                            days.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowSettings(false)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-gray-100"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid gap-5 md:grid-cols-3">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Number of Weeks
                                    </label>

                                    <div className="flex h-11 items-center overflow-hidden rounded-xl border border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setWeeks((value) =>
                                                    Math.max(1, value - 1),
                                                )
                                            }
                                            className="flex h-full w-12 items-center justify-center bg-gray-50 hover:bg-gray-100"
                                        >
                                            <Minus size={18} />
                                        </button>

                                        <div className="flex flex-1 items-center justify-center font-semibold">
                                            {weeks}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setWeeks((value) =>
                                                    Math.min(12, value + 1),
                                                )
                                            }
                                            className="flex h-full w-12 items-center justify-center bg-gray-50 text-xl hover:bg-gray-100"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Days Per Week
                                    </label>

                                    <select
                                        value={daysPerWeek}
                                        onChange={(event) =>
                                            setDaysPerWeek(
                                                Number(event.target.value),
                                            )
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 outline-none focus:border-[#970027]"
                                    >
                                        <option value={5}>
                                            5 Days - Mon to Fri
                                        </option>

                                        <option value={6}>
                                            6 Days - Mon to Sat
                                        </option>

                                        <option value={7}>
                                            7 Days - Mon to Sun
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Start Date
                                    </label>

                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(event) =>
                                            setStartDate(event.target.value)
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 outline-none focus:border-[#970027]"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 border-t border-gray-100 pt-4">
                                <p className="mb-3 text-sm font-semibold text-slate-700">
                                    Quick Presets
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    <PresetButton
                                        text="4w × 5d"
                                        onClick={() => applyPreset(4, 5)}
                                    />

                                    <PresetButton
                                        text="4w × 6d"
                                        onClick={() => applyPreset(4, 6)}
                                    />

                                    <PresetButton
                                        text="8w × 6d"
                                        onClick={() => applyPreset(8, 6)}
                                    />

                                    <PresetButton
                                        text="12w × 6d"
                                        onClick={() => applyPreset(12, 6)}
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* =================================================
                        FILTER CARD
                    ================================================== */}

                    <section className="mb-5 rounded-[20px] border border-gray-200 bg-white px-5 py-3 shadow-sm">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff2f5]">
                                    <Filter
                                        size={19}
                                        className="text-[#970027]"
                                    />
                                </span>

                                <span className="uppercase">Filters</span>
                            </div>

                            {/* SUBJECT */}

                            <select
                                value={selectedSubject}
                                onChange={(event) =>
                                    setSelectedSubject(event.target.value)
                                }
                                className="h-12 w-full min-w-0 flex-1 rounded-[16px] border border-gray-200 bg-[#fafafa] px-4 text-[16px] text-slate-900 transition outline-none focus:border-[#c98796] focus:ring-2 focus:ring-[#970027]/15 sm:min-w-[250px] lg:max-w-[350px]"
                            >
                                {subjects.length === 0 && (
                                    <option value="">All Classes</option>
                                )}

                                {subjects.map((subject) => (
                                    <option
                                        key={subject.id}
                                        value={String(subject.id)}
                                    >
                                        {subject.name}
                                    </option>
                                ))}
                            </select>

                            {/* YEAR */}

                            <select
                                value={selectedYear}
                                onChange={(event) => {
                                    setSelectedYear(event.target.value);

                                    setSelectedSection('');
                                }}
                                className="sm:min-w-[150px]-[16px] h-12 w-full min-w-0 rounded border border-gray-200 bg-[#fafafa] px-4 text-[16px] text-slate-900 transition outline-none focus:border-[#c98796] focus:ring-2 focus:ring-[#970027]/15 sm:w-auto"
                            >
                                <option value="">All Years</option>

                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>

                            {/* SECTION */}

                            <select
                                value={selectedSection}
                                onChange={(event) =>
                                    setSelectedSection(event.target.value)
                                }
                                className="sm:min-w-[150px]-[16px] h-12 w-full min-w-0 rounded border border-gray-200 bg-[#fafafa] px-4 text-[16px] text-slate-900 transition outline-none focus:border-[#c98796] focus:ring-2 focus:ring-[#970027]/15 sm:w-auto"
                            >
                                <option value="">All Sections</option>

                                {sections.map((section) => (
                                    <option key={section} value={section}>
                                        {section}
                                    </option>
                                ))}
                            </select>

                            {/* DATE INFO */}

                            <div className="ml-auto flex items-center gap-3 text-sm whitespace-nowrap text-gray-500">
                                <CalendarDays
                                    size={18}
                                    className="text-[#970027]"
                                />

                                <span>
                                    {normalizedStartDate.toLocaleString(
                                        'en-US',
                                        {
                                            month: 'long',
                                            year: 'numeric',
                                        },
                                    )}
                                </span>

                                <span className="rounded-full border border-[#efbec8] bg-[#fff6f8] px-3 py-1.5 font-semibold text-[#970027]">
                                    {weeks}w × {daysPerWeek}d
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* =================================================
                        LEGEND
                    ================================================== */}

                    <section className="mb-6 rounded-[20px] border border-gray-200 bg-white px-6 py-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
                            <span className="text-sm font-medium text-gray-400 uppercase">
                                Legend
                            </span>

                            <Legend type="gps" text="Present (GPS)" />

                            <Legend type="manual" text="Present (Manual)" />

                            <Legend type="late" text="Late" />

                            <Legend type="absent" text="Absent" />

                            <div className="ml-auto flex items-center gap-2 text-sm text-gray-400">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                                    <Minus size={13} />
                                </span>
                                Non-class day
                            </div>
                        </div>
                    </section>

                    {/* =================================================
                        ATTENDANCE TABLE
                    ================================================== */}

                    <section className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-max min-w-full border-collapse">
                                <thead>
                                    {/* WEEK ROW */}

                                    <tr className="bg-[#970027] text-white">
                                        <th className="sticky left-0 z-30 w-[330px] min-w-[330px] border-r border-white/15 bg-[#970027] px-5 py-4 text-left">
                                            <div className="text-[16px] font-bold">
                                                Student
                                            </div>

                                            <div className="mt-1 text-[12px] font-normal text-white/70">
                                                {activeSubject?.name ??
                                                    'All Classes'}
                                            </div>
                                        </th>

                                        {generatedWeeks.map(
                                            (week, weekIndex) => (
                                                <th
                                                    key={weekIndex}
                                                    colSpan={week.length}
                                                    className="border-r border-white/10 px-3 py-4 text-center text-[14px] font-bold last:border-r-0"
                                                >
                                                    Week {weekIndex + 1}
                                                </th>
                                            ),
                                        )}
                                    </tr>

                                    {/* DAY ROW */}

                                    <tr className="bg-[#89001f] text-white">
                                        <th className="sticky left-0 z-30 min-w-[330px] border-r border-white/10 bg-[#89001f] px-5 py-3 text-left text-[12px] font-semibold text-white/75 uppercase">
                                            Student ID
                                        </th>

                                        {generatedWeeks.flatMap(
                                            (week, weekIndex) =>
                                                week.map((day) => (
                                                    <th
                                                        key={`${weekIndex}-${day.dateKey}`}
                                                        className="h-[55px] min-w-[58px] border-r border-white/10 px-2 text-center"
                                                    >
                                                        <div className="text-[12px] font-semibold">
                                                            {day.day}
                                                        </div>

                                                        <div className="text-[11px] font-medium text-white/55">
                                                            {day.displayDate}
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
                                                className="px-6 py-16 text-center"
                                            >
                                                <div className="text-lg font-semibold text-slate-700">
                                                    No students found
                                                </div>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    No students match the
                                                    selected filters.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <tr
                                                key={`${student.subject_id}-${student.id}`}
                                                className="border-b border-gray-100 last:border-b-0"
                                            >
                                                {/* STUDENT */}

                                                <td className="sticky left-0 z-20 min-w-[330px] border-r border-gray-200 bg-white px-5 py-[17px]">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff3f5] text-sm font-bold text-[#970027]">
                                                            {student.name
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="truncate text-[16px] font-semibold text-black">
                                                                {student.name}
                                                            </div>

                                                            <div className="mt-0.5 text-[11px] text-gray-400 italic">
                                                                {
                                                                    student.student_id
                                                                }
                                                            </div>

                                                            <div className="mt-2 flex gap-2">
                                                                <span className="rounded bg-gray-100 px-2 py-1 text-[10px] text-gray-500">
                                                                    {
                                                                        student.year
                                                                    }
                                                                </span>

                                                                <span className="rounded bg-[#fff2f5] px-2 py-1 text-[10px] font-medium text-[#970027]">
                                                                    {
                                                                        student.section
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* ATTENDANCE DAYS */}

                                                {generatedWeeks.flatMap(
                                                    (week) =>
                                                        week.map((day) => {
                                                            const key = `${selectedSubject}-${student.id}-${day.dateKey}`;

                                                            const status =
                                                                records[key];

                                                            return (
                                                                <td
                                                                    key={key}
                                                                    className="h-[104px] min-w-[58px] border-r border-gray-100 bg-[#fcfcfd] px-1 text-center"
                                                                >
                                                                    <button
                                                                        disabled={
                                                                            gpsLocked.has(
                                                                                key,
                                                                            ) ||
                                                                            savingKey !==
                                                                                null ||
                                                                            day.dateKey >
                                                                                today ||
                                                                            calendar[
                                                                                selectedSubject
                                                                            ]?.[
                                                                                day
                                                                                    .dateKey
                                                                            ] ===
                                                                                'non_class'
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            toggleAttendance(
                                                                                student,
                                                                                day.dateKey,
                                                                            )
                                                                        }
                                                                        title={
                                                                            gpsLocked.has(
                                                                                key,
                                                                            )
                                                                                ? 'GPS attendance is protected'
                                                                                : 'Click to change attendance'
                                                                        }
                                                                        className="group mx-auto flex h-full w-full items-center justify-center transition hover:bg-[#fff7f9]"
                                                                    >
                                                                        <AttendanceCell
                                                                            nonClass={
                                                                                calendar[
                                                                                    selectedSubject
                                                                                ]?.[
                                                                                    day
                                                                                        .dateKey
                                                                                ] ===
                                                                                'non_class'
                                                                            }
                                                                            status={
                                                                                status
                                                                            }
                                                                        />
                                                                    </button>
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

                    {/* =================================================
                        SUMMARY
                    ================================================== */}

                    <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            value={summary.present}
                            label="Present"
                            type="present"
                        />

                        <SummaryCard
                            value={summary.late}
                            label="Late"
                            type="late"
                        />

                        <SummaryCard
                            value={summary.absent}
                            label="Absent"
                            type="absent"
                        />

                        <SummaryCard
                            value={summary.gps}
                            label="GPS Recorded"
                            type="gps"
                        />
                    </section>
                </main>
            </div>
        </>
    );
}

/*
|--------------------------------------------------------------------------
| PRESET BUTTON
|--------------------------------------------------------------------------
*/

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
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#970027]/30 hover:bg-[#fff4f6] hover:text-[#970027]"
        >
            {text}
        </button>
    );
}

/*
|--------------------------------------------------------------------------
| LEGEND
|--------------------------------------------------------------------------
*/

function Legend({
    type,
    text,
}: {
    type: 'gps' | 'manual' | 'late' | 'absent';
    text: string;
}) {
    return (
        <div className="flex items-center gap-2 text-[13px] text-gray-500">
            {type === 'gps' && (
                <CheckCircle2
                    size={18}
                    strokeWidth={2}
                    className="text-emerald-500"
                />
            )}

            {type === 'manual' && (
                <Check
                    size={18}
                    strokeWidth={2.5}
                    className="text-emerald-400"
                />
            )}

            {type === 'late' && (
                <Clock3 size={18} strokeWidth={2} className="text-amber-500" />
            )}

            {type === 'absent' && (
                <XCircle size={18} strokeWidth={2} className="text-red-500" />
            )}

            <span>{text}</span>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| ATTENDANCE CELL
|--------------------------------------------------------------------------
*/

function AttendanceCell({
    status,
    nonClass,
}: {
    status?: AttendanceStatus;
    nonClass?: boolean;
}) {
    if (nonClass) {
        return (
            <div
                title="Non-class day"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-xs text-gray-300"
            >
                ·
            </div>
        );
    }

    if (status === 'present_gps') {
        return (
            <div className="h-40px w-40px relative flex h-10 w-10 items-center justify-center rounded-[15px] border border-emerald-200 bg-emerald-50 text-[13px] font-bold text-emerald-700">
                P
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#970027]" />
            </div>
        );
    }

    if (status === 'present_manual') {
        return (
            <div className="flex h-10 w-10 items-center justify-center rounded-[15px] border border-emerald-200 bg-emerald-50 text-[13px] font-bold text-emerald-700">
                P
            </div>
        );
    }

    if (status === 'late') {
        return (
            <div className="flex h-10 w-10 items-center justify-center rounded-[15px] border border-amber-200 bg-amber-50 text-[13px] font-bold text-amber-700">
                L
            </div>
        );
    }

    if (status === 'absent') {
        return (
            <div className="flex h-10 w-10 items-center justify-center rounded-[15px] border border-red-200 bg-red-50 text-[13px] font-bold text-red-600">
                A
            </div>
        );
    }

    return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-xs text-gray-300">
            -
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| SUMMARY CARD
|--------------------------------------------------------------------------
*/

function SummaryCard({
    value,
    label,
    type,
}: {
    value: number;
    label: string;
    type: 'present' | 'late' | 'absent' | 'gps';
}) {
    const renderIcon = () => {
        if (type === 'present') {
            return <CheckCircle2 size={24} className="text-emerald-500" />;
        }

        if (type === 'late') {
            return <Clock3 size={24} className="text-amber-500" />;
        }

        if (type === 'absent') {
            return <XCircle size={24} className="text-red-500" />;
        }

        return <Wifi size={24} className="text-[#970027]" />;
    };

    const iconStyle =
        type === 'present'
            ? 'border-emerald-200 bg-emerald-50'
            : type === 'late'
              ? 'border-amber-200 bg-amber-50'
              : type === 'absent'
                ? 'border-red-200 bg-red-50'
                : 'border-[#edc1cb] bg-[#fff3f6]';

    const valueStyle =
        type === 'present'
            ? 'text-emerald-700'
            : type === 'late'
              ? 'text-amber-700'
              : type === 'absent'
                ? 'text-red-600'
                : 'text-[#970027]';

    return (
        <div className="flex min-h-[112px] items-center gap-5 rounded-[18px] border border-gray-200 bg-white px-6 shadow-sm">
            <div
                className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[15px] border ${iconStyle}`}
            >
                {renderIcon()}
            </div>

            <div>
                <div
                    className={`text-[30px] leading-none font-bold ${valueStyle}`}
                >
                    {value}
                </div>

                <div className="mt-2 text-sm text-gray-500">{label}</div>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| ATTENDANCE TEXT FOR EXPORT
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| FORMAT DATE
|--------------------------------------------------------------------------
*/

function formatDateKey(date: Date) {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
