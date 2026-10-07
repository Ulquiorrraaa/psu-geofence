import { Head, router, usePage } from '@inertiajs/react';
import {
    Clock,
    MapPin,
    Pencil,
    Plus,
    Radio,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';

type Schedule = {
    id: number;
    subject: string;
    instructor?: string;
    start_time?: string;
    startTime?: string;
    end_time?: string;
    endTime?: string;
    students: number;
    location: string;
    latitude?: number | string;
    longitude?: number | string;
    coordinates?: string;
    radius: number | string;
    days: string[];
    status: 'Completed' | 'Ongoing' | 'Scheduled';
    recording?: boolean;
};
type Props = {
    instructorSchedules?: Schedule[];
    auth?: { user?: { name?: string } };
    errors?: Record<string, string>;
};
const DAYS = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
];
const SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const blank = () => ({
    subject: '',
    students: '',
    start_time: '',
    end_time: '',
    days: [] as string[],
    location: '',
    radius: '30',
    latitude: '',
    longitude: '',
    status: 'Scheduled',
});
const time = (v?: string) => {
    if (!v) {
        return '--:--';
    }

    const [h, m] = v.slice(0, 5).split(':').map(Number);

    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export default function Schedules() {
    const {
        instructorSchedules = [],
        auth,
        errors = {},
    } = usePage().props as Props;
    const [open, setOpen] = useState(false),
        [edit, setEdit] = useState<Schedule | null>(null),
        [form, setForm] = useState(blank),
        [busy, setBusy] = useState(false),
        [locating, setLocating] = useState(false),
        [message, setMessage] = useState(''),
        [submitError, setSubmitError] = useState('');
    const field = (key: string, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));
    const close = (force = false) => {
        if (busy && !force) {
            return;
        }

        setOpen(false);
        setEdit(null);
        setForm(blank());
        setMessage('');
        setSubmitError('');
    };
    const create = () => {
        setEdit(null);
        setForm(blank());
        setOpen(true);
    };
    const modify = (s: Schedule) => {
        setEdit(s);
        setForm({
            subject: s.subject,
            students: String(s.students),
            start_time: s.start_time || s.startTime?.slice(0, 5) || '',
            end_time: s.end_time || s.endTime?.slice(0, 5) || '',
            days: s.days || [],
            location: s.location,
            radius: String(s.radius).replace(/[^\d.]/g, '') || '30',
            latitude: String(s.latitude ?? ''),
            longitude: String(s.longitude ?? ''),
            status: s.status,
        });
        setOpen(true);
    };
    const day = (d: string) =>
        setForm((f) => ({
            ...f,
            days: f.days.includes(d)
                ? f.days.filter((x) => x !== d)
                : [...f.days, d],
        }));
    const locate = () => {
        if (!navigator.geolocation) {
            return setMessage('GPS is not supported by this browser.');
        }

        setLocating(true);
        setMessage('Detecting location…');
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setForm((f) => ({
                    ...f,
                    latitude: coords.latitude.toFixed(7),
                    longitude: coords.longitude.toFixed(7),
                }));
                setLocating(false);
                setMessage('Current location captured.');
            },
            () => {
                setLocating(false);
                setMessage('Allow location permission and try again.');
            },
            { enableHighAccuracy: true, timeout: 15000 },
        );
    };
    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (!form.days.length) {
            return setMessage('Select at least one class day.');
        }

        if (!form.latitude || !form.longitude) {
            return setMessage(
                'Click "Detect My Location" before creating the schedule.',
            );
        }

        setSubmitError('');
        setBusy(true);
        const payload = {
            ...form,
            instructor: auth?.user?.name || 'Instructor',
            coordinates: `${form.latitude}, ${form.longitude}`,
        };
        const o = {
            preserveScroll: true,
            onSuccess: () => {
                setBusy(false);
                close(true);
            },
            onError: (serverErrors: Record<string, string>) => {
                setSubmitError(
                    Object.values(serverErrors)[0] ||
                        'The schedule could not be created. Check the form and try again.',
                );
            },
            onFinish: () => setBusy(false),
        };

        if (edit) {
            router.put(`/schedules/${edit.id}`, payload, o);
        } else {
            router.post('/schedules', payload, o);
        }
    };
    const remove = (s: Schedule) =>
        confirm(`Delete ${s.subject}?`) &&
        router.delete(`/schedules/${s.id}`, { preserveScroll: true });
    const recording = (s: Schedule) => {
        const save = (lat?: number, lng?: number) =>
            router.patch(
                `/schedules/${s.id}/recording`,
                { recording: !s.recording, latitude: lat, longitude: lng },
                { preserveScroll: true },
            );

        if (s.recording) {
            return save();
        }

        navigator.geolocation?.getCurrentPosition(
            ({ coords }) => save(coords.latitude, coords.longitude),
            () => alert('Allow location access to start recording.'),
            { enableHighAccuracy: true, timeout: 15000 },
        );
    };

    return (
        <>
            <Head title="Schedules" />
            <main className="min-h-full bg-[#f7f8fa] px-5 py-7 text-slate-900 sm:px-7 lg:px-8">
                <div className="w-full min-w-0">
                    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-[#8f001f]">
                                My Class Schedules
                            </h1>
                            <p className="mt-1 text-lg text-black">
                                Manage your class schedules and geofenced
                                locations
                            </p>
                        </div>
                        <button
                            onClick={create}
                            className="flex items-center gap-3 self-start rounded-lg bg-[#970027] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#790020]"
                        >
                            <Plus size={22} />
                            Add Schedule
                        </button>
                    </header>
                    {instructorSchedules.length ? (
                        <section className="grid gap-7 lg:grid-cols-2">
                            {instructorSchedules.map((s) => (
                                <article
                                    key={s.id}
                                    className={`rounded-xl border border-l-4 border-gray-200 ${s.status === 'Ongoing' ? 'border-l-blue-500' : s.status === 'Completed' ? 'border-l-emerald-500' : 'border-l-gray-300'} bg-white p-5 shadow-sm sm:p-6`}
                                >
                                    <div className="flex justify-between gap-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-2xl font-bold">
                                                {s.subject}
                                            </h2>
                                            <span
                                                className={`rounded-full px-3 py-1 text-sm ${s.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : s.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
                                            >
                                                {s.status}
                                            </span>
                                        </div>
                                        <div className="flex gap-5 text-red-600">
                                            <button
                                                onClick={() => modify(s)}
                                                aria-label="Edit"
                                            >
                                                <Pencil size={21} />
                                            </button>
                                            <button
                                                onClick={() => remove(s)}
                                                aria-label="Delete"
                                            >
                                                <Trash2 size={21} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-lg text-gray-600">
                                        {s.instructor ||
                                            auth?.user?.name ||
                                            'Instructor'}
                                    </p>
                                    <div className="mt-5 space-y-3.5 text-lg text-slate-600">
                                        <p className="flex gap-3">
                                            <Clock className="text-slate-400" />
                                            {time(
                                                s.start_time || s.startTime,
                                            )}{' '}
                                            - {time(s.end_time || s.endTime)}
                                        </p>
                                        <p className="flex gap-3">
                                            <Users className="text-slate-400" />
                                            {s.students} students enrolled
                                        </p>
                                        <div className="flex gap-3">
                                            <MapPin className="shrink-0 text-slate-400" />
                                            <div>
                                                <p>{s.location}</p>
                                                <p className="text-sm text-slate-500">
                                                    {s.latitude && s.longitude
                                                        ? `${Number(s.latitude).toFixed(4)}° N, ${Number(s.longitude).toFixed(4)}° E`
                                                        : s.coordinates ||
                                                          'GPS not recorded'}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    Radius: {s.radius}m
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 flex min-h-8 flex-wrap gap-2">
                                        {s.days.map((d) => (
                                            <span
                                                key={d}
                                                className="rounded-md bg-red-100 px-3 py-1 text-sm text-red-700"
                                            >
                                                {SHORT[DAYS.indexOf(d)] ||
                                                    d.slice(0, 3)}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-5 flex items-center justify-between gap-4 border-t pt-5">
                                        <div className="flex gap-3">
                                            <Radio className="text-slate-400" />
                                            <div>
                                                <p className="font-semibold">
                                                    GPS Attendance Recording
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    Turn on to auto-detect your
                                                    location and start recording
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            role="switch"
                                            aria-checked={!!s.recording}
                                            onClick={() => recording(s)}
                                            className={`relative h-10 w-[70px] shrink-0 rounded-full ${s.recording ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                        >
                                            <span
                                                className={`absolute top-1 h-8 w-8 rounded-full bg-white shadow transition-all ${s.recording ? 'left-[34px]' : 'left-1'}`}
                                            />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </section>
                    ) : (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
                            <h2 className="text-xl font-semibold">
                                No class schedules yet
                            </h2>
                            <p className="text-gray-500">
                                Create your first schedule to begin.
                            </p>
                        </div>
                    )}
                </div>
            </main>
            {open && (
                <div
                    onMouseDown={(e) => e.target === e.currentTarget && close()}
                    className="fixed inset-0 z-50 overflow-y-auto bg-black/55 px-4 py-8"
                >
                    <div className="mx-auto w-full max-w-[820px] min-w-0 rounded-2xl bg-white p-5 text-[#17233b] shadow-2xl sm:p-7">
                        <div className="mb-5 flex justify-between">
                            <h2 className="text-2xl font-bold">
                                {edit ? 'Edit Schedule' : 'Add Class Schedule'}
                            </h2>
                            <button onClick={() => close()}>
                                <X />
                            </button>
                        </div>
                        <form onSubmit={submit} className="space-y-5">
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field
                                    label="Subject Name"
                                    error={errors.subject}
                                >
                                    <input
                                        required
                                        value={form.subject}
                                        onChange={(e) =>
                                            field('subject', e.target.value)
                                        }
                                        placeholder="e.g., Mathematics 101"
                                    />
                                </Field>
                                <Field
                                    label="Number of Students"
                                    error={errors.students}
                                >
                                    <input
                                        required
                                        min="1"
                                        type="number"
                                        value={form.students}
                                        onChange={(e) =>
                                            field('students', e.target.value)
                                        }
                                        placeholder="e.g., 45"
                                    />
                                </Field>
                                <Field label="Start Time">
                                    <input
                                        required
                                        type="time"
                                        value={form.start_time}
                                        onChange={(e) =>
                                            field('start_time', e.target.value)
                                        }
                                    />
                                </Field>
                                <Field label="End Time">
                                    <input
                                        required
                                        type="time"
                                        value={form.end_time}
                                        onChange={(e) =>
                                            field('end_time', e.target.value)
                                        }
                                    />
                                </Field>
                            </div>
                            <fieldset>
                                <legend className="mb-2 text-lg font-medium">
                                    Days
                                </legend>
                                <div className="flex flex-wrap gap-4">
                                    {DAYS.map((d, i) => (
                                        <label
                                            key={d}
                                            className="flex items-center gap-1.5 text-lg"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form.days.includes(d)}
                                                onChange={() => day(d)}
                                            />
                                            {SHORT[i]}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                            <Field label="Location">
                                <input
                                    required
                                    value={form.location}
                                    onChange={(e) =>
                                        field('location', e.target.value)
                                    }
                                    placeholder="e.g., Building A - Room 201"
                                />
                            </Field>
                            <Field label="Geofence Radius (meters)">
                                <input
                                    required
                                    min="5"
                                    type="number"
                                    value={form.radius}
                                    onChange={(e) =>
                                        field('radius', e.target.value)
                                    }
                                />
                                <small>
                                    Students must be within this radius to be
                                    marked present
                                </small>
                            </Field>
                            <div className="rounded-xl border border-[#e6b4c0] bg-[#f9e9ed] p-5 text-[#8f001f]">
                                <div className="flex gap-4">
                                    <MapPin className="shrink-0" />
                                    <div>
                                        <p className="text-lg font-semibold">
                                            GPS Location Auto-Detection
                                        </p>
                                        <p>
                                            GPS coordinates will be detected
                                            from your device and used as the
                                            geofence center.
                                        </p>
                                        {form.latitude && (
                                            <p className="mt-2 font-medium">
                                                {Number(form.latitude).toFixed(
                                                    5,
                                                )}
                                                ,{' '}
                                                {Number(form.longitude).toFixed(
                                                    5,
                                                )}
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            disabled={locating}
                                            onClick={locate}
                                            className="mt-3 rounded-lg bg-[#970027] px-4 py-2 font-semibold text-white transition hover:bg-[#790020]"
                                        >
                                            {locating
                                                ? 'Detecting…'
                                                : form.latitude
                                                  ? 'Update GPS Location'
                                                  : 'Detect My Location'}
                                        </button>
                                        {message && (
                                            <p className="mt-2 text-sm">
                                                {message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 border-t pt-5">
                                {submitError && (
                                    <p className="mr-auto self-center text-sm font-medium text-red-600">
                                        {submitError}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => close()}
                                    className="rounded-xl bg-gray-100 px-6 py-3 text-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busy}
                                    className="rounded-lg bg-[#970027] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#790020]"
                                >
                                    {busy
                                        ? 'Saving…'
                                        : edit
                                          ? 'Save Changes'
                                          : 'Create Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`label>input:not([type=checkbox]){margin-top:.25rem;width:100%;border:1px solid #cbd5e1;border-radius:1rem;padding:.8rem 1rem;font-size:1.05rem;outline:none}label>input:focus{border-color:#8f001f;box-shadow:0 0 0 3px #8f001f18}small{display:block;margin-top:.3rem;color:#64748b}`}</style>
        </>
    );
}
function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="block text-lg font-medium">
            {label}
            {children}
            {error && (
                <span className="mt-1 block text-sm text-red-600">{error}</span>
            )}
        </label>
    );
}
