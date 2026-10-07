# GPS tracking — complete working code

These are the complete final files, including regression tests. The changes are already applied to the workspace. No snippets or omitted sections.

The card retains its existing container, icon, colors, and toggle. Its location is initialized empty on each page load and populated only from a new browser watch. Location errors and switching OFF clear it.

Use http://localhost:8000 for local development or HTTPS for remote access. Browser geolocation controls the underlying location provider; high accuracy is a request, not a guarantee of satellite GPS. The reported accuracy is displayed, and readings over 50 meters cannot trigger browser automatic attendance. Existing API clients may omit accuracy for compatibility; supplied accuracy must be at most 50 meters.

Validation: 8 watcher tests and 32 Laravel tests passed; TypeScript, targeted ESLint, and production build passed. Device movement and physical GPS precision require a real-device check.

## resources/js/pages/student/Dashboard.tsx

```tsx
import { Head, Link } from '@inertiajs/react';

import {
    Activity,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock3,
    GraduationCap,
    MapPin,
    QrCode,
    Radio,
    TrendingUp,
    UserRound,
} from 'lucide-react';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLiveLocation } from '@/hooks/use-live-location';

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type Student = {
    name?: string | null;
    course?: string | null;
    section?: string | null;
    student_id?: string | null;
};

type AttendanceStats = {
    week_present?: number;
    week_total?: number;

    month_present?: number;
    month_total?: number;

    overall_percentage?: number;

    classes_today?: number;
    classes_remaining?: number;
};

type CurrentClass = {
    schedule_id?: number | null;

    subject_code?: string | null;
    subject_name?: string | null;

    start_time?: string | null;
    end_time?: string | null;

    building?: string | null;
    room?: string | null;

    instructor?: string | null;

    check_in?: string | null;
    time_in_class?: string | null;

    geofence_latitude?: number | null;
    geofence_longitude?: number | null;
    geofence_radius_meters?: number | null;
};

type StudentDashboardProps = {
    student?: Student | null;

    attendanceStats?: AttendanceStats | null;

    currentClass?: CurrentClass | null;
};

type CheckInResponse = {
    success?: boolean;

    inside_geofence?: boolean;

    status?: 'present' | 'late' | string;

    attendance_id?: number;

    time_in?: string | null;

    distance?: number;

    radius?: number;

    message?: string;
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
}

function distanceInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const earthRadius = 6371000;

    const toRadians = (degree: number) => (degree * Math.PI) / 180;

    const deltaLatitude = toRadians(lat2 - lat1);

    const deltaLongitude = toRadians(lon2 - lon1);

    const a =
        Math.sin(deltaLatitude / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(deltaLongitude / 2) ** 2;

    const boundedA = Math.max(0, Math.min(1, a));
    const c = 2 * Math.atan2(Math.sqrt(boundedA), Math.sqrt(1 - boundedA));

    return earthRadius * c;
}

/*
|--------------------------------------------------------------------------
| Student Dashboard
|--------------------------------------------------------------------------
*/

export default function StudentDashboard(props: StudentDashboardProps) {
    return (
        <StudentDashboardContent
            key={`${props.currentClass?.schedule_id ?? 'none'}-${props.currentClass?.check_in ?? ''}`}
            {...props}
        />
    );
}

function StudentDashboardContent({
    student,
    attendanceStats,
    currentClass,
}: StudentDashboardProps) {
    /*
    |--------------------------------------------------------------------------
    | QR
    |--------------------------------------------------------------------------
    */

    const [qrOpen, setQrOpen] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | GPS
    |--------------------------------------------------------------------------
    */

    const { tracking, position, gpsError, toggleTracking } = useLiveLocation();
    const latitude = position?.latitude ?? null;
    const longitude = position?.longitude ?? null;
    const accuracy = position?.accuracy ?? null;
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;

        return () => {
            mounted.current = false;
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Attendance Save State
    |--------------------------------------------------------------------------
    */

    const [attendanceSaved, setAttendanceSaved] = useState(
        Boolean(currentClass?.check_in),
    );

    const [attendanceStatus, setAttendanceStatus] = useState<string | null>(
        currentClass?.check_in ? 'present' : null,
    );

    const [savedCheckIn, setSavedCheckIn] = useState<string | null>(
        currentClass?.check_in ?? null,
    );

    const [attendanceMessage, setAttendanceMessage] = useState<string | null>(
        currentClass?.check_in ? 'Attendance confirmed.' : null,
    );

    const [attendanceError, setAttendanceError] = useState<string | null>(null);

    const [savingAttendance, setSavingAttendance] = useState(false);

    /*
     * Prevent watchPosition from repeatedly
     * submitting the same attendance.
     */
    const attendanceRequestInProgress = useRef(false);

    const attendanceSubmitted = useRef(Boolean(currentClass?.check_in));

    const submittedScheduleId = useRef<number | null>(
        currentClass?.check_in ? (currentClass?.schedule_id ?? null) : null,
    );

    /*
    |--------------------------------------------------------------------------
    | Reset Attendance State When Current Class Changes
    |--------------------------------------------------------------------------
    */

    /*
    |--------------------------------------------------------------------------
    | Student
    |--------------------------------------------------------------------------
    */

    const studentName = student?.name?.trim() || 'Student';

    const courseSection = [student?.course, student?.section]
        .filter(Boolean)
        .join(' ');

    /*
    |--------------------------------------------------------------------------
    | Current Class
    |--------------------------------------------------------------------------
    */

    const subjectTitle = [
        currentClass?.subject_code,

        currentClass?.subject_name,
    ]
        .filter(Boolean)
        .join(' — ');

    const hasCurrentClass = Boolean(
        currentClass?.subject_code || currentClass?.subject_name,
    );

    const classLocation = [currentClass?.building, currentClass?.room]
        .filter(Boolean)
        .join(' – ');

    /*
    |--------------------------------------------------------------------------
    | Geofence
    |--------------------------------------------------------------------------
    */

    const geofenceDistance = useMemo(() => {
        const classLatitude = toNumber(currentClass?.geofence_latitude);
        const classLongitude = toNumber(currentClass?.geofence_longitude);
        const radius = toNumber(currentClass?.geofence_radius_meters);

        if (
            latitude === null ||
            longitude === null ||
            classLatitude === null ||
            classLongitude === null ||
            Math.abs(classLatitude) > 90 ||
            Math.abs(classLongitude) > 180 ||
            radius === null ||
            radius <= 0
        ) {
            return null;
        }

        return distanceInMeters(
            latitude,
            longitude,
            classLatitude,
            classLongitude,
        );
    }, [
        latitude,
        longitude,
        currentClass?.geofence_latitude,
        currentClass?.geofence_longitude,
        currentClass?.geofence_radius_meters,
    ]);

    const computedInsideGeofence =
        geofenceDistance === null
            ? null
            : geofenceDistance <= Number(currentClass?.geofence_radius_meters);

    /*
    |--------------------------------------------------------------------------
    | Save Attendance
    |--------------------------------------------------------------------------
    */

    async function saveAttendance(
        scheduleId: number,
        studentLatitude: number,
        studentLongitude: number,
        studentAccuracy: number,
    ): Promise<CheckInResponse> {
        const csrfToken = document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.getAttribute('content');

        const response = await fetch('/student/attendance/check-in', {
            method: 'POST',

            headers: {
                Accept: 'application/json',

                'Content-Type': 'application/json',

                'X-Requested-With': 'XMLHttpRequest',

                ...(csrfToken
                    ? {
                          'X-CSRF-TOKEN': csrfToken,
                      }
                    : {}),
            },

            credentials: 'same-origin',

            body: JSON.stringify({
                schedule_id: scheduleId,

                latitude: studentLatitude,

                longitude: studentLongitude,
                accuracy: studentAccuracy,
            }),
        });

        let data: CheckInResponse | null = null;

        try {
            data = (await response.json()) as CheckInResponse;
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(
                data?.message ||
                    `Unable to record attendance (${response.status}).`,
            );
        }

        if (!data || data.success !== true) {
            throw new Error(data?.message || 'Attendance was not saved.');
        }

        return data;
    }

    /*
    |--------------------------------------------------------------------------
    | Automatically Check In
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Being inside the geofence is NOT enough to show
    | "Attendance Confirmed".
    |
    | Laravel must successfully save the attendance first.
    |
    */

    useEffect(() => {
        const scheduleId = currentClass?.schedule_id;

        if (
            !tracking ||
            !hasCurrentClass ||
            !scheduleId ||
            latitude === null ||
            longitude === null ||
            accuracy === null ||
            accuracy > 50 ||
            computedInsideGeofence !== true
        ) {
            return;
        }

        /*
         * Attendance already exists from server.
         */
        if (currentClass?.check_in) {
            attendanceSubmitted.current = true;

            submittedScheduleId.current = scheduleId;

            return;
        }

        /*
         * We already successfully submitted
         * this exact schedule.
         */
        if (
            attendanceSubmitted.current &&
            submittedScheduleId.current === scheduleId
        ) {
            return;
        }

        /*
         * A request is already running.
         */
        if (attendanceRequestInProgress.current) {
            return;
        }

        const checkIn = async () => {
            attendanceRequestInProgress.current = true;

            setSavingAttendance(true);

            setAttendanceError(null);

            setAttendanceMessage('Confirming attendance...');

            try {
                const result = await saveAttendance(
                    scheduleId,
                    latitude,
                    longitude,
                    accuracy,
                );

                if (!mounted.current) {
                    return;
                }

                /*
                 * Only after Laravel returns success
                 * do we mark attendance as confirmed.
                 */
                attendanceSubmitted.current = true;

                submittedScheduleId.current = scheduleId;

                setAttendanceSaved(true);

                setAttendanceStatus(result.status ?? 'present');

                setSavedCheckIn(result.time_in ?? null);

                setAttendanceMessage(result.message || 'Attendance confirmed.');

                setAttendanceError(null);
            } catch (error) {
                if (!mounted.current) {
                    return;
                }

                attendanceSubmitted.current = false;

                submittedScheduleId.current = null;

                setAttendanceSaved(false);

                setAttendanceStatus(null);

                setAttendanceMessage(null);

                setAttendanceError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to record attendance.',
                );
            } finally {
                attendanceRequestInProgress.current = false;

                if (mounted.current) {
                    setSavingAttendance(false);
                }
            }
        };

        void checkIn();
    }, [
        tracking,
        hasCurrentClass,

        currentClass?.schedule_id,

        currentClass?.check_in,

        latitude,
        longitude,

        computedInsideGeofence,
        accuracy,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Attendance
    |--------------------------------------------------------------------------
    */

    const weekPresent = attendanceStats?.week_present;

    const weekTotal = attendanceStats?.week_total;

    const monthPresent = attendanceStats?.month_present;

    const monthTotal = attendanceStats?.month_total;

    const overall = attendanceStats?.overall_percentage;

    const weekPercent =
        weekPresent != null && weekTotal
            ? Math.round((weekPresent / weekTotal) * 100)
            : null;

    const monthPercent =
        monthPresent != null && monthTotal
            ? Math.round((monthPresent / monthTotal) * 100)
            : null;

    /*
    |--------------------------------------------------------------------------
    | Student QR
    |--------------------------------------------------------------------------
    */

    const qrValue = student?.student_id
        ? `PSU-STUDENT:${student.student_id}`
        : 'PSU-STUDENT:UNAVAILABLE';

    /*
    |--------------------------------------------------------------------------
    | Geofence Status Text
    |--------------------------------------------------------------------------
    */

    const geofenceTitle = attendanceSaved
        ? attendanceStatus === 'late'
            ? 'Attendance Recorded — Late'
            : 'Attendance Confirmed'
        : savingAttendance
          ? 'Confirming Attendance'
          : computedInsideGeofence === null
            ? 'Class Area Unavailable'
            : computedInsideGeofence
              ? 'Inside Classroom Area'
              : 'Outside Classroom Area';

    const geofenceMessage = attendanceSaved
        ? attendanceMessage || 'Your attendance has been recorded.'
        : savingAttendance
          ? 'Saving your attendance...'
          : computedInsideGeofence === null
            ? 'A live location and configured class geofence are required.'
            : accuracy !== null && accuracy > 50
              ? 'Waiting for a more accurate GPS signal before confirming attendance.'
              : computedInsideGeofence
                ? attendanceError ||
                  'You are inside the classroom geofence. Waiting for attendance confirmation.'
                : 'Move inside the classroom geofence to confirm attendance';

    const geofenceSuccess = attendanceSaved;

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Head title="Student Dashboard" />

            <div className="min-h-full overflow-x-hidden bg-[#f7f8fa]">
                <main className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-5 sm:py-6 lg:px-7 xl:px-8">
                    {/* TOP SUMMARY CARDS */}

                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            eyebrow="THIS WEEK"
                            value={
                                weekPresent != null && weekTotal != null
                                    ? `${weekPresent}/${weekTotal}`
                                    : '—'
                            }
                            subtext={
                                weekPercent != null
                                    ? `${weekPercent}% present`
                                    : 'Attendance data unavailable'
                            }
                            subtextClass="text-emerald-600"
                            icon={<CheckCircle2 size={27} />}
                            iconClass="bg-emerald-50 text-emerald-500"
                        />

                        <SummaryCard
                            eyebrow="THIS MONTH"
                            value={
                                monthPresent != null && monthTotal != null
                                    ? `${monthPresent}/${monthTotal}`
                                    : '—'
                            }
                            subtext={
                                monthPercent != null
                                    ? `${monthPercent}% present`
                                    : 'Attendance data unavailable'
                            }
                            subtextClass="text-[#9b002d]"
                            icon={<TrendingUp size={27} />}
                            iconClass="bg-[#fff0f4] text-[#9b002d]"
                        />

                        <SummaryCard
                            eyebrow="OVERALL RATE"
                            value={overall != null ? `${overall}%` : '—'}
                            subtext={
                                overall != null
                                    ? overall >= 90
                                        ? 'Excellent standing'
                                        : 'Attendance standing'
                                    : 'Attendance data unavailable'
                            }
                            subtextClass="text-[#9b002d]"
                            icon={<Activity size={27} />}
                            iconClass="bg-[#fff0f4] text-[#9b002d]"
                        />

                        <SummaryCard
                            eyebrow="CLASSES TODAY"
                            value={
                                attendanceStats?.classes_today != null
                                    ? String(attendanceStats.classes_today)
                                    : '—'
                            }
                            subtext={
                                attendanceStats?.classes_remaining != null
                                    ? `${attendanceStats.classes_remaining} remaining`
                                    : 'Schedule data unavailable'
                            }
                            subtextClass="text-amber-600"
                            icon={<GraduationCap size={27} />}
                            iconClass="bg-amber-50 text-amber-500"
                        />
                    </section>

                    {/* MAIN CARD */}

                    <section className="mt-5 rounded-[22px] border border-gray-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-5 lg:p-6">
                        {/* STUDENT INFORMATION + REGISTER BUTTON */}

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                                    Good {getDayPart()}
                                </p>

                                <h2 className="mt-1 text-2xl font-bold text-gray-950">
                                    {studentName}
                                </h2>

                                <p className="mt-1 text-sm break-words text-gray-600">
                                    {[courseSection, student?.student_id]
                                        .filter(Boolean)
                                        .join(' · ') ||
                                        'Student information unavailable'}
                                </p>
                            </div>

                            <Link
                                href="/student/register-class"
                                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#9b002d] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#7e0025] sm:w-auto"
                            >
                                <GraduationCap size={19} />
                                Register for Class
                            </Link>
                        </div>

                        {/* GEOFENCE STATUS */}

                        {hasCurrentClass &&
                            computedInsideGeofence !== undefined && (
                                <div
                                    className={`mt-4 flex min-w-0 flex-col gap-4 rounded-[20px] border px-4 py-4 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5 ${
                                        geofenceSuccess
                                            ? 'border-emerald-200 bg-[#ebfff6]'
                                            : computedInsideGeofence
                                              ? 'border-blue-200 bg-blue-50'
                                              : 'border-amber-200 bg-amber-50'
                                    }`}
                                >
                                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                        <CheckCircle2
                                            size={31}
                                            className={
                                                geofenceSuccess
                                                    ? 'shrink-0 text-emerald-500'
                                                    : computedInsideGeofence
                                                      ? 'shrink-0 text-blue-500'
                                                      : 'shrink-0 text-amber-500'
                                            }
                                        />

                                        <div className="min-w-0">
                                            <h3 className="text-base font-bold text-gray-900 sm:text-lg">
                                                {geofenceTitle}
                                            </h3>

                                            <p className="text-sm break-words text-gray-700">
                                                {geofenceMessage}
                                            </p>

                                            {attendanceError &&
                                                !attendanceSaved && (
                                                    <p className="mt-1 text-xs font-semibold break-words text-red-600">
                                                        {attendanceError}
                                                    </p>
                                                )}
                                        </div>
                                    </div>

                                    {savedCheckIn && (
                                        <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                            <Clock3 size={13} />

                                            {savedCheckIn}
                                        </span>
                                    )}
                                </div>
                            )}

                        {/* CURRENT CLASS */}

                        <div className="mt-4 min-w-0 rounded-[22px] border border-gray-200 bg-white p-4 shadow-sm sm:mt-5 sm:p-5">
                            <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold tracking-[0.16em] text-[#9b002d] uppercase">
                                        {hasCurrentClass
                                            ? 'Now in session'
                                            : 'Current class'}
                                    </p>

                                    <h3 className="mt-2 text-lg font-bold break-words text-gray-950 sm:text-xl">
                                        {hasCurrentClass
                                            ? subjectTitle
                                            : 'No class in session'}
                                    </h3>
                                </div>

                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0f4] text-[#9b002d]">
                                    <Clock3 size={23} />
                                </span>
                            </div>

                            {hasCurrentClass && (
                                <>
                                    <div className="mt-4 min-w-0 space-y-2.5 text-sm text-gray-800">
                                        <InfoRow
                                            icon={<Clock3 size={18} />}
                                            text={
                                                currentClass?.start_time &&
                                                currentClass?.end_time
                                                    ? `${currentClass.start_time} – ${currentClass.end_time}`
                                                    : currentClass?.start_time ||
                                                      currentClass?.end_time ||
                                                      'Schedule unavailable'
                                            }
                                        />

                                        <InfoRow
                                            icon={<MapPin size={18} />}
                                            text={
                                                classLocation ||
                                                'Room information unavailable'
                                            }
                                        />

                                        <InfoRow
                                            icon={<UserRound size={18} />}
                                            text={
                                                currentClass?.instructor ||
                                                'Instructor unavailable'
                                            }
                                        />
                                    </div>

                                    {(savedCheckIn ||
                                        currentClass?.time_in_class ||
                                        currentClass?.end_time) && (
                                        <div className="mt-5 border-t border-gray-100 pt-4">
                                            <div className="flex flex-col gap-2 text-sm font-semibold sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                                <span className="inline-flex items-center gap-2 text-gray-900">
                                                    <Clock3
                                                        size={17}
                                                        className="text-[#9b002d]"
                                                    />
                                                    Time in class
                                                </span>

                                                <span className="text-[#9b002d]">
                                                    {currentClass?.time_in_class ||
                                                        '—'}
                                                </span>
                                            </div>

                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                                                <div className="h-full w-full rounded-full bg-[#9b002d]" />
                                            </div>

                                            <div className="mt-2 flex flex-col gap-1 text-xs text-gray-600 sm:flex-row sm:justify-between">
                                                <span>
                                                    Check-in:{' '}
                                                    {savedCheckIn ||
                                                        currentClass?.check_in ||
                                                        '—'}
                                                </span>

                                                <span>
                                                    Ends:{' '}
                                                    {currentClass?.end_time ||
                                                        '—'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* GPS TRACKING */}

                        <div className="mt-4 min-w-0 rounded-[22px] border border-gray-200 bg-white p-4 shadow-sm sm:mt-5 sm:p-5">
                            <div className="flex min-w-0 items-center justify-between gap-3 sm:gap-4">
                                <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                                        <Radio size={23} />
                                    </span>

                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-950 sm:text-lg">
                                            GPS Tracking
                                        </h3>

                                        <p className="mt-0.5 font-mono text-[11px] leading-5 break-words text-gray-700 sm:text-sm">
                                            {latitude !== null &&
                                            longitude !== null
                                                ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                                                : tracking && !gpsError
                                                  ? 'Getting your location...'
                                                  : 'Location unavailable'}
                                        </p>

                                        <p
                                            className="mt-1 text-xs text-gray-700"
                                            role="status"
                                        >
                                            {gpsError
                                                ? 'GPS unavailable'
                                                : !tracking
                                                  ? 'GPS Off'
                                                  : position
                                                    ? 'GPS Active'
                                                    : 'Getting your location...'}
                                        </p>
                                        {accuracy !== null && (
                                            <p className="mt-1 text-xs text-gray-700">
                                                Accuracy: ±{Math.ceil(accuracy)}{' '}
                                                m
                                            </p>
                                        )}
                                        {accuracy !== null && accuracy > 50 && (
                                            <p
                                                className="mt-1 text-xs break-words text-amber-700"
                                                role="status"
                                            >
                                                GPS signal is weak. Move near a
                                                window or outdoors and try
                                                again.
                                            </p>
                                        )}
                                        {position && (
                                            <>
                                                <p className="mt-1 text-xs text-gray-700">
                                                    {computedInsideGeofence ===
                                                    null
                                                        ? 'Class area unavailable'
                                                        : computedInsideGeofence
                                                          ? 'Inside class area'
                                                          : 'Outside class area'}
                                                    {geofenceDistance !==
                                                        null &&
                                                        ` · ${geofenceDistance.toFixed(1)} m from class center`}
                                                </p>
                                                <a
                                                    href={`https://www.google.com/maps?q=${position.latitude},${position.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-1 inline-block text-xs font-semibold text-emerald-700 underline"
                                                >
                                                    View on Google Maps
                                                </a>
                                            </>
                                        )}

                                        {gpsError && (
                                            <p className="mt-1 text-xs break-words text-red-600">
                                                {gpsError}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={toggleTracking}
                                    aria-pressed={tracking}
                                    aria-label="Toggle GPS tracking"
                                    className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                                        tracking
                                            ? 'bg-emerald-500'
                                            : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                                            tracking
                                                ? 'translate-x-7'
                                                : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* SMALL STATS */}

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-3 sm:gap-4">
                            <MiniStat
                                value={
                                    weekPresent != null && weekTotal != null
                                        ? `${weekPresent}/${weekTotal}`
                                        : '—'
                                }
                                label="This Week"
                                valueClass="text-emerald-600"
                            />

                            <MiniStat
                                value={
                                    monthPresent != null && monthTotal != null
                                        ? `${monthPresent}/${monthTotal}`
                                        : '—'
                                }
                                label="This Month"
                                valueClass="text-[#9b002d]"
                            />

                            <MiniStat
                                value={overall != null ? `${overall}%` : '—'}
                                label="Overall"
                                valueClass="text-[#9b002d]"
                            />
                        </div>

                        {/* STUDENT ID QR */}

                        <div className="mt-4 min-w-0 overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-sm sm:mt-5">
                            <button
                                type="button"
                                onClick={() => setQrOpen((value) => !value)}
                                className="flex w-full min-w-0 items-center justify-between gap-3 p-4 text-left sm:gap-4 sm:p-5"
                                aria-expanded={qrOpen}
                            >
                                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff0f4] text-[#9b002d]">
                                        <QrCode size={22} />
                                    </span>

                                    <div className="min-w-0">
                                        <h3 className="font-bold break-words text-gray-950 sm:text-lg">
                                            Student ID QR Code
                                        </h3>

                                        <p className="text-sm break-words text-gray-700">
                                            For manual guard verification
                                        </p>
                                    </div>
                                </div>

                                {qrOpen ? (
                                    <ChevronUp className="shrink-0" size={21} />
                                ) : (
                                    <ChevronDown
                                        className="shrink-0"
                                        size={21}
                                    />
                                )}
                            </button>

                            {qrOpen && (
                                <div className="border-t border-gray-100 px-3 pt-5 pb-6 text-center sm:px-5 sm:pb-7">
                                    <div className="mx-auto inline-flex max-w-full items-center justify-center overflow-hidden rounded-[18px] border-2 border-[#ead0d7] bg-white p-3 sm:p-4">
                                        <QRCodeSVG
                                            value={qrValue}
                                            size={180}
                                            fgColor="#9b002d"
                                            bgColor="#ffffff"
                                            level="M"
                                        />
                                    </div>

                                    <p className="mt-4 font-mono text-sm font-bold break-words text-gray-950">
                                        {student?.student_id ||
                                            'Student ID unavailable'}
                                    </p>

                                    <p className="mt-1 text-sm break-words text-gray-700">
                                        {[studentName, courseSection]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}

/*
|--------------------------------------------------------------------------
| Summary Card
|--------------------------------------------------------------------------
*/

function SummaryCard({
    eyebrow,
    value,
    subtext,
    subtextClass,
    icon,
    iconClass,
}: {
    eyebrow: string;
    value: string;
    subtext: string;
    subtextClass: string;
    icon: ReactNode;
    iconClass: string;
}) {
    return (
        <article className="relative min-h-[138px] min-w-0 rounded-[22px] border border-gray-200 bg-white p-5 pr-16 shadow-sm sm:min-h-[145px] sm:p-6 sm:pr-20">
            <p className="text-sm font-semibold tracking-wide text-gray-500">
                {eyebrow}
            </p>

            <p className="mt-2 text-3xl font-bold break-words text-black sm:text-4xl">
                {value}
            </p>

            <p
                className={`mt-2 text-sm font-semibold break-words ${subtextClass}`}
            >
                {subtext}
            </p>

            <span
                className={`absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full sm:top-6 sm:right-6 sm:h-12 sm:w-12 ${iconClass}`}
            >
                {icon}
            </span>
        </article>
    );
}

/*
|--------------------------------------------------------------------------
| Mini Stat
|--------------------------------------------------------------------------
*/

function MiniStat({
    value,
    label,
    valueClass,
}: {
    value: string;
    label: string;
    valueClass: string;
}) {
    return (
        <div className="min-w-0 rounded-[20px] border border-gray-200 bg-white px-4 py-4 text-center shadow-sm sm:px-5">
            <p className={`text-2xl font-bold break-words ${valueClass}`}>
                {value}
            </p>

            <p className="mt-1 text-sm text-gray-700">{label}</p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Information Row
|--------------------------------------------------------------------------
*/

function InfoRow({ icon, text }: { icon: ReactNode; text: string }) {
    return (
        <div className="flex min-w-0 items-start gap-3">
            <span className="shrink-0 text-gray-900">{icon}</span>

            <span className="min-w-0 break-words">{text}</span>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Greeting
|--------------------------------------------------------------------------
*/

function getDayPart() {
    const hour = new Date().getHours();

    if (hour < 12) {
        return 'Morning';
    }

    if (hour < 18) {
        return 'Afternoon';
    }

    return 'Evening';
}
```

## resources/js/hooks/use-live-location.ts

```typescript
import { useEffect, useRef, useState } from 'react';

export type LivePosition = {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
};

function availabilityError(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    if (!window.isSecureContext) {
        return 'Location requires HTTPS or localhost. Open the portal using a secure address.';
    }

    if (!navigator.geolocation) {
        return 'Geolocation is not supported by this browser.';
    }

    return null;
}

export function useLiveLocation() {
    // Never hydrate the current position from props, storage, or attendance records.
    const [tracking, setTracking] = useState(true);
    const [position, setPosition] = useState<LivePosition | null>(null);
    const [gpsError, setGpsError] = useState<string | null>(availabilityError);
    const stopWatch = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!tracking || availabilityError()) {
            return;
        }

        const geolocation = navigator.geolocation;
        let active = true;
        const requestedAt = Date.now();
        let lastTimestamp = requestedAt;
        let watchId: number | null = null;
        const stop = () => {
            active = false;

            if (watchId !== null) {
                geolocation.clearWatch(watchId);
                watchId = null;
            }
        };
        stopWatch.current = stop;

        const fail = (message: string) => {
            setPosition(null);
            setGpsError(message);
        };

        try {
            watchId = geolocation.watchPosition(
                (result) => {
                    if (!active) {
                        return;
                    }

                    const { latitude, longitude, accuracy } = result.coords;

                    if (
                        !Number.isFinite(latitude) ||
                        Math.abs(latitude) > 90 ||
                        !Number.isFinite(longitude) ||
                        Math.abs(longitude) > 180 ||
                        !Number.isFinite(accuracy) ||
                        accuracy < 0 ||
                        !Number.isFinite(result.timestamp) ||
                        result.timestamp < lastTimestamp
                    ) {
                        fail(
                            'The browser returned an invalid or old location. Turn GPS off and on to try again.',
                        );

                        return;
                    }

                    lastTimestamp = result.timestamp;
                    setPosition({
                        latitude,
                        longitude,
                        accuracy,
                        timestamp: result.timestamp,
                    });
                    setGpsError(null);
                },
                (error) => {
                    if (!active) {
                        return;
                    }

                    switch (error.code) {
                        case 1:
                            fail(
                                'Location permission denied. Allow location access in your browser and turn GPS on again.',
                            );
                            stop();
                            setTracking(false);
                            break;
                        case 2:
                            fail(
                                'Location unavailable. Enable device location services/GPS, move near a window or outdoors, and try again.',
                            );
                            break;
                        case 3:
                            fail(
                                'Location request timed out after 15 seconds. Move near a window or outdoors. GPS is still trying; toggle off and on to retry.',
                            );
                            break;
                        default:
                            fail(
                                'Unable to read your location. Turn GPS off and on to try again.',
                            );
                    }
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
            );
        } catch {
            queueMicrotask(() => {
                if (active) {
                    fail(
                        'Unable to start GPS. Check browser location permissions and device location services.',
                    );
                    stop();
                    setTracking(false);
                }
            });
        }

        return () => {
            stop();
            stopWatch.current = null;
        };
    }, [tracking]);

    function toggleTracking() {
        // Stop immediately so already queued callbacks cannot restore an old fix.
        stopWatch.current?.();
        setPosition(null);
        setGpsError(availabilityError());
        setTracking(!tracking);
    }

    return { tracking, position, gpsError, toggleTracking };
}
```

## app/Http/Controllers/Api/StudentDashboardController.php

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    public function index(Request $request)
    {
        $student = $request->user();
        $now = now('Asia/Manila');
        $currentClass = $student->registeredSchedules()->get()->first(fn ($schedule) => in_array($now->format('l'), $schedule->days ?? [], true)
            && $schedule->start_time <= $now->format('H:i:s')
            && $schedule->end_time >= $now->format('H:i:s')
        );
        $todayAttendance = $currentClass ? $student->attendances()->where('schedule_id', $currentClass->id)
            ->whereDate('attendance_date', $now->toDateString())->first() : null;
        $present = $student->attendances()->whereRaw('LOWER(status) IN (?, ?)', ['present', 'late']);

        return response()->json([
            'student' => ['name' => $student->name, 'student_number' => $student->student_id],
            'gps_tracking' => [
                // Current location is obtained exclusively by the browser.
                'status' => 'Awaiting browser location',
                'latitude' => null,
                'longitude' => null,
            ],
            'current_class' => $currentClass?->only(['id', 'subject', 'location', 'start_time', 'end_time', 'recording']),
            'attendance_status' => $todayAttendance?->status,
            'weekly_present' => (clone $present)->whereDate('attendance_date', '>=', $now->copy()->startOfWeek())
                ->whereDate('attendance_date', '<=', $now)->count(),
            'monthly_present' => (clone $present)->whereDate('attendance_date', '>=', $now->copy()->startOfMonth())
                ->whereDate('attendance_date', '<=', $now)->count(),
        ]);
    }
}
```

## app/Http/Controllers/StudentAttendanceCheckInController.php

```php
<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentAttendanceCheckInController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'schedule_id' => [
                'required',
                'integer',
                'exists:schedules,id',
            ],

            'latitude' => [
                'required',
                'numeric',
                'between:-90,90',
            ],

            // Optional for existing API clients; browser check-ins always send it.
            'accuracy' => ['sometimes', 'required', 'numeric', 'min:0', 'max:50'],

            'longitude' => [
                'required',
                'numeric',
                'between:-180,180',
            ],
        ]);

        $student = $request->user();
        abort_unless($student->role === 'student' && $student->status !== 'Inactive', 403);

        $schedule = Schedule::query()
            ->findOrFail(
                $validated['schedule_id']
            );

        /*
        |--------------------------------------------------------------------------
        | Make sure student is actually registered
        |--------------------------------------------------------------------------
        */

        $registered =
            $schedule
                ->registeredStudents()
                ->where(
                    'users.id',
                    $student->id
                )
                ->exists();

        if (! $registered) {
            return response()->json([
                'success' => false,
                'message' => 'You are not registered for this class.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Check class day
        |--------------------------------------------------------------------------
        */

        if (! $schedule->recording) {
            return response()->json(['success' => false, 'message' => 'Attendance recording is not active for this class.'], 422);
        }
        $now = now('Asia/Manila');

        $todayName =
            strtolower(
                $now->format('D')
            );

        $days =
            $this->normalizeDays(
                $schedule->days
            );

        if (! in_array(
            $todayName,
            $days,
            true
        )) {
            return response()->json([
                'success' => false,
                'message' => 'This class is not scheduled today.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Check class time
        |--------------------------------------------------------------------------
        */

        if (
            ! $schedule->start_time ||
            ! $schedule->end_time
        ) {
            return response()->json([
                'success' => false,
                'message' => 'The class schedule has no valid time.',
            ], 422);
        }

        $classStart =
            Carbon::parse(
                $now->toDateString().' '.
                $schedule->start_time,
                'Asia/Manila'
            );

        $classEnd =
            Carbon::parse(
                $now->toDateString().' '.
                $schedule->end_time,
                'Asia/Manila'
            );

        /*
         * Allow check-in 15 minutes before class.
         */
        $checkInOpens =
            $classStart
                ->copy()
                ->subMinutes(15);

        if ($now->lt($checkInOpens)) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance is not open yet.',
            ], 422);
        }

        if ($now->gt($classEnd)) {
            return response()->json([
                'success' => false,
                'message' => 'This class has already ended.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Classroom coordinates
        |--------------------------------------------------------------------------
        */

        if (! $schedule->coordinates) {
            return response()->json([
                'success' => false,
                'message' => 'This class has no classroom coordinates.',
            ], 422);
        }

        $coordinates =
            preg_split(
                '/\s*,\s*/',
                trim(
                    (string) $schedule->coordinates
                )
            );

        if (
            ! isset(
                $coordinates[0],
                $coordinates[1]
            ) ||
            ! is_numeric($coordinates[0]) ||
            ! is_numeric($coordinates[1]) || count($coordinates) !== 2 || abs((float) $coordinates[0]) > 90 || abs((float) $coordinates[1]) > 180
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid classroom coordinates.',
            ], 422);
        }

        $classLatitude =
            (float) $coordinates[0];

        $classLongitude =
            (float) $coordinates[1];

        /*
        |--------------------------------------------------------------------------
        | Radius
        |--------------------------------------------------------------------------
        */

        $radius =
            (float) preg_replace(
                '/[^0-9.]/',
                '',
                (string) (
                    $schedule->radius ?? 50
                )
            );

        if ($radius <= 0) {
            $radius = 50;
        }

        /*
        |--------------------------------------------------------------------------
        | Student location
        |--------------------------------------------------------------------------
        */

        $studentLatitude =
            (float) $validated['latitude'];

        $studentLongitude =
            (float) $validated['longitude'];

        /*
        |--------------------------------------------------------------------------
        | Calculate distance
        |--------------------------------------------------------------------------
        */

        $distance =
            $this->distanceInMeters(
                $studentLatitude,
                $studentLongitude,
                $classLatitude,
                $classLongitude
            );

        /*
        |--------------------------------------------------------------------------
        | Reject if outside geofence
        |--------------------------------------------------------------------------
        */

        if ($distance > $radius) {
            return response()->json([
                'success' => false,

                'inside_geofence' => false,

                'distance' => round($distance, 2),

                'radius' => $radius,

                'message' => 'You are outside the classroom geofence.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Determine present / late
        |--------------------------------------------------------------------------
        |
        | First 15 minutes after start = Present
        | More than 15 minutes after start = Late
        |
        */

        $lateAfter =
            $classStart
                ->copy()
                ->addMinutes(15);

        $status =
            $now->gt($lateAfter)
                ? 'late'
                : 'present';

        /*
        |--------------------------------------------------------------------------
        | Save attendance
        |--------------------------------------------------------------------------
        */

        $attendance = $schedule->getConnection()->transaction(function () use ($schedule, $student, $now, $status, $studentLatitude, $studentLongitude) {
            $lockedSchedule = Schedule::whereKey($schedule->id)->lockForUpdate()->firstOrFail();
            abort_unless($lockedSchedule->recording, 422, 'Attendance recording is not active for this class.');
            $key = [
                'student_id' => $student->id,
                'schedule_id' => $schedule->id,
                'attendance_date' => $now->toDateString(),
            ];
            $existing = Attendance::where('student_id', $student->id)->where('schedule_id', $schedule->id)->whereDate('attendance_date', $now->toDateString())->first();
            if ($existing && in_array(strtolower($existing->status), ['present', 'late'], true)) {
                return $existing;
            }

            $record = $existing ?? new Attendance($key);
            $record->fill([
                'status' => $status,
                'time_in' => $now,
                'latitude' => $studentLatitude,
                'longitude' => $studentLongitude,
            ])->save();

            return $record;
        });

        return response()->json([
            'success' => true,

            'inside_geofence' => true,

            'status' => strtolower($attendance->status),

            'attendance_id' => $attendance->id,

            'time_in' => $attendance
                ->time_in
                ?->timezone(
                    'Asia/Manila'
                )
                ->format('H:i'),

            'distance' => round($distance, 2),

            'message' => strtolower($attendance->status) === 'late'
                    ? 'Attendance recorded as late.'
                    : 'Attendance confirmed.',
        ]);
    }

    /**
     * Haversine distance.
     */
    private function distanceInMeters(
        float $lat1,
        float $lon1,
        float $lat2,
        float $lon2
    ): float {
        $earthRadius = 6371000;

        $latFrom =
            deg2rad($lat1);

        $lonFrom =
            deg2rad($lon1);

        $latTo =
            deg2rad($lat2);

        $lonTo =
            deg2rad($lon2);

        $latDelta =
            $latTo - $latFrom;

        $lonDelta =
            $lonTo - $lonFrom;

        $a =
            sin($latDelta / 2) ** 2 +
            cos($latFrom) *
            cos($latTo) *
            sin($lonDelta / 2) ** 2;

        $a = max(0.0, min(1.0, $a));

        $c =
            2 *
            atan2(
                sqrt($a),
                sqrt(1 - $a)
            );

        return $earthRadius * $c;
    }

    /**
     * Normalize schedule days.
     */
    private function normalizeDays(
        array|string|null $days
    ): array {
        if ($days === null) {
            return [];
        }

        if (! is_array($days)) {
            $decoded =
                json_decode(
                    $days,
                    true
                );

            $days =
                is_array($decoded)
                    ? $decoded
                    : explode(',', $days);
        }

        $map = [
            'monday' => 'mon',
            'mon' => 'mon',
            'm' => 'mon',

            'tuesday' => 'tue',
            'tue' => 'tue',
            'tues' => 'tue',

            'wednesday' => 'wed',
            'wed' => 'wed',
            'w' => 'wed',

            'thursday' => 'thu',
            'thu' => 'thu',
            'thur' => 'thu',
            'thurs' => 'thu',

            'friday' => 'fri',
            'fri' => 'fri',
            'f' => 'fri',

            'saturday' => 'sat',
            'sat' => 'sat',

            'sunday' => 'sun',
            'sun' => 'sun',
        ];

        return collect($days)
            ->map(function ($day) use ($map) {
                $key =
                    strtolower(
                        trim(
                            (string) $day
                        )
                    );

                return $map[$key] ?? null;
            })
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
```

## tests/Feature/Student/GpsTrackingTest.php

```php
<?php

namespace Tests\Feature\Student;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Date;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GpsTrackingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Date::setTestNow(Date::parse('2026-10-06 09:05:00', 'Asia/Manila'));
    }

    protected function tearDown(): void
    {
        Date::setTestNow();
        parent::tearDown();
    }

    private function registeredClass(): array
    {
        $student = User::factory()->create(['role' => 'student']);
        $owner = User::factory()->create(['role' => 'instructor']);
        $schedule = Schedule::create([
            'user_id' => $owner->id, 'subject' => 'GPS Test', 'instructor' => $owner->name,
            'start_time' => '09:00:00', 'end_time' => '10:00:00', 'students' => 25,
            'location' => 'Room 1', 'coordinates' => '14.5995000, 120.9842000',
            'radius' => '50', 'days' => ['Tuesday'], 'status' => 'Scheduled', 'recording' => true,
        ]);
        $schedule->registeredStudents()->attach($student);

        return [$student, $schedule];
    }

    public function test_dashboard_never_returns_attendance_coordinates_as_current_location(): void
    {
        [$student, $schedule] = $this->registeredClass();
        Attendance::create([
            'student_id' => $student->id, 'schedule_id' => $schedule->id,
            'attendance_date' => '2026-10-06', 'status' => 'present', 'time_in' => now(),
            'latitude' => 1.1234567, 'longitude' => 2.1234567,
        ]);
        $this->actingAs($student)->get('/student/dashboard')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('student/Dashboard')
                ->where('location.latitude', null)->where('location.longitude', null));
        Sanctum::actingAs($student);
        $this->getJson('/api/student/dashboard')->assertOk()
            ->assertJsonPath('gps_tracking.latitude', null)
            ->assertJsonPath('gps_tracking.longitude', null)
            ->assertJsonPath('gps_tracking.status', 'Awaiting browser location');
    }

    public function test_check_in_stores_student_coordinates_without_replacing_them_with_class_center(): void
    {
        [$student, $schedule] = $this->registeredClass();
        $this->actingAs($student)->postJson('/student/attendance/check-in', [
            'schedule_id' => $schedule->id, 'latitude' => 14.5995347,
            'longitude' => 120.9842478, 'accuracy' => 8,
        ])->assertOk()->assertJsonPath('inside_geofence', true);
        $attendance = Attendance::firstOrFail();
        $this->assertSame('14.5995347', $attendance->latitude);
        $this->assertSame('120.9842478', $attendance->longitude);
    }

    public function test_haversine_rejects_a_student_outside_the_class_radius(): void
    {
        [$student, $schedule] = $this->registeredClass();
        $response = $this->actingAs($student)->postJson('/student/attendance/check-in', [
            'schedule_id' => $schedule->id, 'latitude' => 14.6005,
            'longitude' => 120.9842, 'accuracy' => 8,
        ])->assertStatus(422)->assertJsonPath('inside_geofence', false);
        $this->assertEqualsWithDelta(111.19, $response->json('distance'), 0.1);
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_poor_reported_accuracy_is_rejected_without_recording_attendance(): void
    {
        [$student, $schedule] = $this->registeredClass();
        $this->actingAs($student)->postJson('/student/attendance/check-in', [
            'schedule_id' => $schedule->id, 'latitude' => 14.5995,
            'longitude' => 120.9842, 'accuracy' => 51,
        ])->assertUnprocessable()->assertJsonValidationErrors('accuracy');
        $this->assertDatabaseCount('attendances', 0);
    }
}
```

## tests/js/live-location.test.cjs

```javascript
const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

// Execute the production hook with deterministic browser and React hook adapters.
// No simulated coordinates are bundled into the application.
function setup({ secure = true, supported = true, throws = false } = {}) {
    const slots = [];
    const effects = [];
    const watches = [];
    const cleared = [];
    let cursor = 0;
    let effectCursor = 0;
    let pending = [];
    const react = {
        useState(initial) {
            const index = cursor++;
            if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
            return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
        },
        useRef(initial) {
            const index = cursor++;
            if (!(index in slots)) slots[index] = { current: initial };
            return slots[index];
        },
        useEffect(callback, dependencies) {
            const index = effectCursor++;
            const previous = effects[index];
            if (!previous || dependencies.some((value, i) => value !== previous.dependencies[i])) {
                pending.push(() => {
                    previous?.cleanup?.();
                    effects[index] = { dependencies, cleanup: callback() };
                });
            }
        },
    };
    const geolocation = {
        watchPosition(success, error, options) {
            if (throws) throw new Error('Provider unavailable');
            watches.push({ success, error, options });
            return watches.length - 1;
        },
        clearWatch(id) { cleared.push(id); },
    };
    const source = fs.readFileSync('resources/js/hooks/use-live-location.ts', 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const context = { exports: {}, require: () => react, window: { isSecureContext: secure },
        navigator: supported ? { geolocation } : {}, Date, Number, Math, queueMicrotask };
    vm.runInNewContext(compiled, context);
    const render = () => {
        cursor = 0;
        effectCursor = 0;
        const result = context.exports.useLiveLocation();
        const callbacks = pending;
        pending = [];
        callbacks.forEach((callback) => callback());
        return result;
    };
    return { render, watches, cleared, unmount: () => effects.forEach((effect) => effect.cleanup?.()) };
}
const fix = (latitude = -14.921534123, longitude = -120.589347123, accuracy = 8, timestamp = Date.now() + 1000) =>
    ({ coords: { latitude, longitude, accuracy }, timestamp });

test('fresh high-accuracy watch updates exact coordinates and reported accuracy', () => {
    const app = setup();
    assert.equal(app.render().position, null);
    assert.equal(JSON.stringify(app.watches[0].options), JSON.stringify({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }));
    app.watches[0].success(fix());
    let state = app.render();
    assert.equal(state.position.latitude, -14.921534123);
    assert.equal(state.position.longitude, -120.589347123);
    assert.equal(state.position.accuracy, 8);
    app.watches[0].success(fix(14.000001, 120.000001, 80, Date.now() + 2000));
    state = app.render();
    assert.equal(state.position.latitude, 14.000001);
    assert.equal(state.position.accuracy, 80);
});

test('OFF clears watch ID zero and blocks queued fixes; ON and refresh begin empty', () => {
    const app = setup();
    app.render();
    app.watches[0].success(fix());
    app.render().toggleTracking();
    assert.ok(app.cleared.includes(0));
    app.watches[0].success(fix());
    assert.equal(app.render().position, null);
    assert.equal(app.render().tracking, false);
    app.render().toggleTracking();
    assert.equal(app.render().position, null);
    assert.equal(app.watches.length, 2);
    app.unmount();
    assert.ok(app.cleared.includes(1));
    assert.equal(setup().render().position, null);
});

for (const [code, message] of [[1, /permission denied/], [2, /Enable device location/], [3, /timed out/]]) {
    test('location error ' + code + ' clears the previous fix and reports recovery guidance', () => {
        const app = setup();
        app.render();
        app.watches[0].success(fix());
        app.watches[0].error({ code });
        const state = app.render();
        assert.equal(state.position, null);
        assert.match(state.gpsError, message);
        if (code === 1) {
            assert.equal(state.tracking, false);
            assert.ok(app.cleared.includes(0));
        } else {
            app.watches[0].success(fix(14.1, 120.1, 12, Date.now() + 2000));
            assert.equal(app.render().gpsError, null);
            assert.equal(app.render().position.accuracy, 12);
        }
    });
}

test('insecure and unsupported contexts never start a watcher', () => {
    for (const options of [{ secure: false }, { supported: false }]) {
        const app = setup(options);
        assert.ok(app.render().gpsError);
        assert.equal(app.watches.length, 0);
    }
});

test('cached, out-of-order, and invalid fixes never become current location', () => {
    const app = setup();
    app.render();
    app.watches[0].success(fix(14, 120, 8, Date.now() - 10000));
    assert.equal(app.render().position, null);
    app.watches[0].success(fix());
    app.watches[0].success(fix(14, 120, 8, Date.now() - 1000));
    assert.equal(app.render().position, null);
    app.watches[0].success(fix(91));
    assert.equal(app.render().position, null);
});

test('provider startup exceptions are handled', async () => {
    const app = setup({ throws: true });
    app.render();
    await Promise.resolve();
    assert.match(app.render().gpsError, /Unable to start GPS/);
    assert.equal(app.render().tracking, false);
});
```

