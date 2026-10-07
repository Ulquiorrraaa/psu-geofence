import { Head, Link, usePoll } from '@inertiajs/react';

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
import ProfileAvatar from '@/components/profile-avatar';
import { useLiveLocation } from '@/hooks/use-live-location';

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type Student = {
    name?: string | null;
    profile_picture_url?: string | null;
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
    recording?: boolean;
    attendance_status?: string | null;
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
    usePoll(10000, { only: ['currentClass', 'attendanceStats'] });

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
        currentClass?.check_in
            ? (currentClass.attendance_status ?? 'present')
            : null,
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
            currentClass?.recording === false ||
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
        currentClass?.recording,

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
                <main className="w-full min-w-0 px-3 py-4 sm:px-5 sm:py-6 lg:px-7 xl:px-8">
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
                                    <ProfileAvatar
                                        name={studentName}
                                        url={student?.profile_picture_url}
                                        className="mr-3 inline-flex size-12 align-middle"
                                    />
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
                                        className={`absolute top-1 left-0 h-6 w-6 rounded-full bg-white shadow transition-transform ${
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
