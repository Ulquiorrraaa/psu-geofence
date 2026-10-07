import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Clock, MapPin, Pencil, Trash2, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';

type Schedule = {
    id: number;
    instructor_id?: number;
    section?: string;
    instructor?: string;
    subject: string;
    days?: string[];

    startTime?: string;
    endTime?: string;

    start_time?: string;
    end_time?: string;

    location?: string;
    room?: string;

    coordinates?: string;

    latitude?: string;
    longitude?: string;

    students?: number;
    students_count?: number;

    radius?: string;
    geofence_radius?: number;

    status?: string;
};

type Instructor = {
    id: number;
    name: string;
    email?: string;
    schedules?: Schedule[];
};

type PageProps = {
    instructors: Instructor[];
};

export default function Schedules() {
    const { instructors = [] } = usePage<PageProps>().props;

    const days = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
    ];

    const [day, setDay] = useState('Monday');

    const [selectedInstructorId, setSelectedInstructorId] = useState<
        number | null
    >(null);

    const selectedInstructor =
        instructors.find(
            (instructor) => instructor.id === selectedInstructorId,
        ) ??
        instructors[0] ??
        null;

    const selectedSchedules = useMemo(() => {
        if (!selectedInstructor) {
            return [];
        }

        return (
            selectedInstructor.schedules?.filter((schedule) =>
                schedule.days?.includes(day),
            ) ?? []
        );
    }, [selectedInstructor, day]);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const form = useForm({
        instructor_id: 0,
        subject: '',
        section: '',
        start_time: '',
        end_time: '',
        students: 25,
        location: '',
        coordinates: '',
        radius: 50,
        days: ['Monday'],
        status: 'Scheduled',
    });
    function openForm(schedule: Schedule) {
        form.clearErrors();
        setEditingId(schedule.id);
        form.setData({
            instructor_id: selectedInstructor?.id ?? 0,
            subject: schedule?.subject ?? '',
            section: schedule?.section ?? '',
            start_time: (schedule?.start_time ?? '').slice(0, 5),
            end_time: (schedule?.end_time ?? '').slice(0, 5),
            students: schedule?.students ?? 25,
            location: schedule?.location ?? '',
            coordinates: schedule?.coordinates ?? '',
            radius: Number(schedule?.radius ?? 50),
            days: schedule?.days ?? [day],
            status: schedule?.status ?? 'Scheduled',
        });
        setShowForm(true);
    }
    function saveSchedule(event: React.FormEvent) {
        event.preventDefault();

        if (form.processing || !editingId) {
            return;
        }

        const options = {
            preserveScroll: true,
            onSuccess: () => setShowForm(false),
        };

        form.put('/admin/schedules/' + editingId, options);
    }
    function deleteSchedule(schedule: Schedule) {
        if (
            deleting ||
            !window.confirm(
                `Delete ${schedule.subject} and its attendance records?`,
            )
        ) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/schedules/${schedule.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleting(false),
        });
    }
    const countClassesByDay = (instructor: Instructor) => {
        return (
            instructor.schedules?.filter((schedule) =>
                schedule.days?.includes(day),
            ).length ?? 0
        );
    };

    return (
        <>
            <Head title="Schedules" />

            <div className="relative z-10 min-h-full space-y-6 bg-[#f7f8fa] p-5 text-gray-900 sm:p-7">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#8f001f]">
                            Class Schedules
                        </h1>

                        <p className="mt-1 text-base text-gray-600">
                            View instructor schedules by day
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    {days.map((selectedDay) => (
                        <button
                            type="button"
                            key={selectedDay}
                            onClick={() => setDay(selectedDay)}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                day === selectedDay
                                    ? 'bg-[#970027] text-white'
                                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {selectedDay}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,2fr)]">
                    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                        <div className="border-b bg-gray-50 p-4">
                            <h2 className="font-bold text-gray-900">
                                Instructors
                            </h2>

                            <p className="text-sm text-gray-600">
                                Select to view schedule
                            </p>
                        </div>

                        {instructors.length > 0 ? (
                            instructors.map((instructor) => {
                                const classes = countClassesByDay(instructor);

                                return (
                                    <button
                                        type="button"
                                        key={instructor.id}
                                        onClick={() =>
                                            setSelectedInstructorId(
                                                instructor.id,
                                            )
                                        }
                                        className={`flex w-full items-center justify-between border-b p-4 text-left ${
                                            selectedInstructor?.id ===
                                            instructor.id
                                                ? 'border-l-4 border-red-800 bg-red-50'
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {instructor.name}
                                            </h3>

                                            <p className="text-sm text-gray-600">
                                                {classes}{' '}
                                                {classes === 1
                                                    ? 'class'
                                                    : 'classes'}{' '}
                                                on {day}
                                            </p>
                                        </div>

                                        <span className="text-gray-500">›</span>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="p-4 text-gray-500">
                                No instructors found.
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 space-y-4">
                        <div className="rounded-xl border bg-white p-4 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900">
                                {selectedInstructor?.name ??
                                    'No instructor selected'}
                            </h2>

                            <p className="text-gray-600">Schedule for {day}</p>
                        </div>

                        {selectedSchedules.length > 0 ? (
                            selectedSchedules.map((schedule) => {
                                const startTime =
                                    schedule.startTime ??
                                    schedule.start_time ??
                                    'No start time';

                                const endTime =
                                    schedule.endTime ??
                                    schedule.end_time ??
                                    'No end time';

                                const location =
                                    schedule.location ??
                                    schedule.room ??
                                    'No location';

                                const coordinates =
                                    schedule.coordinates ??
                                    `${schedule.latitude ?? ''} ${
                                        schedule.longitude ?? ''
                                    }`;

                                const students =
                                    schedule.students ??
                                    schedule.students_count ??
                                    0;

                                const radius =
                                    schedule.radius ??
                                    `${schedule.geofence_radius ?? 30}m`;

                                return (
                                    <div
                                        key={schedule.id}
                                        className="relative rounded-xl border bg-white p-5 shadow-sm"
                                    >
                                        <div className="absolute top-4 right-4 flex gap-3 text-gray-700">
                                            <button
                                                type="button"
                                                aria-label={`Edit ${schedule.subject}`}
                                                onClick={() =>
                                                    openForm(schedule)
                                                }
                                            >
                                                <Pencil size={18} />
                                            </button>

                                            <button
                                                type="button"
                                                aria-label={`Delete ${schedule.subject}`}
                                                disabled={deleting}
                                                onClick={() =>
                                                    deleteSchedule(schedule)
                                                }
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="space-y-3 border-l-4 border-green-500 pl-4">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {schedule.subject}
                                                </h3>

                                                <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                                                    {schedule.status ??
                                                        'Scheduled'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Clock size={16} />
                                                {startTime} - {endTime}
                                            </div>

                                            <div className="flex items-start gap-2 text-gray-700">
                                                <MapPin
                                                    size={16}
                                                    className="mt-1"
                                                />

                                                <div>
                                                    {location}
                                                    <br />

                                                    <span className="text-sm text-gray-500">
                                                        {coordinates}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Users size={16} />
                                                {students} students
                                            </div>

                                            <div>
                                                <span className="text-sm text-gray-600">
                                                    Geofence Radius:
                                                </span>

                                                <span className="ml-2 rounded bg-gray-100 px-2 py-1 text-sm text-gray-800">
                                                    {radius}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rounded-xl border bg-white p-6 text-gray-500 shadow-sm">
                                No schedules found for this instructor on {day}.
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <form
                        onSubmit={saveSchedule}
                        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6 text-gray-900 shadow-xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="schedule-form-title"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2
                                id="schedule-form-title"
                                className="text-xl font-bold"
                            >
                                Edit Schedule
                            </h2>
                            <button
                                type="button"
                                disabled={form.processing}
                                aria-label="Close"
                                onClick={() => setShowForm(false)}
                            >
                                <X />
                            </button>
                        </div>
                        {Object.values(form.errors).length > 0 && (
                            <p role="alert" className="mb-4 text-red-700">
                                {Object.values(form.errors).join(' ')}
                            </p>
                        )}
                        <fieldset
                            disabled={form.processing}
                            className="grid gap-4 sm:grid-cols-2"
                        >
                            <label className="grid gap-1">
                                Instructor
                                <select
                                    required
                                    value={form.data.instructor_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'instructor_id',
                                            Number(e.target.value),
                                        )
                                    }
                                    className="rounded-lg border p-2"
                                >
                                    {instructors.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid gap-1">
                                Subject
                                <input
                                    required
                                    value={form.data.subject}
                                    onChange={(e) =>
                                        form.setData('subject', e.target.value)
                                    }
                                    className="rounded-lg border p-2"
                                />
                            </label>
                            <label className="grid gap-1">
                                Section
                                <input
                                    value={form.data.section}
                                    onChange={(e) =>
                                        form.setData('section', e.target.value)
                                    }
                                    className="rounded-lg border p-2"
                                />
                            </label>
                            <label className="grid gap-1">
                                Students
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={form.data.students}
                                    onChange={(e) =>
                                        form.setData(
                                            'students',
                                            Number(e.target.value),
                                        )
                                    }
                                    className="rounded-lg border p-2"
                                />
                            </label>
                            <label className="grid gap-1">
                                Start time
                                <input
                                    required
                                    type="time"
                                    value={form.data.start_time}
                                    onChange={(e) =>
                                        form.setData(
                                            'start_time',
                                            e.target.value,
                                        )
                                    }
                                    className="rounded-lg border p-2"
                                />
                            </label>
                            <label className="grid gap-1">
                                End time
                                <input
                                    required
                                    type="time"
                                    value={form.data.end_time}
                                    onChange={(e) =>
                                        form.setData('end_time', e.target.value)
                                    }
                                    className="rounded-lg border p-2"
                                />
                            </label>
                            <label className="grid gap-1">
                                Location
                                <input
                                    required
                                    value={form.data.location}
                                    onChange={(e) =>
                                        form.setData('location', e.target.value)
                                    }
                                    className="rounded-lg border p-2"
                                />
                            </label>
                            <label className="grid gap-1">
                                Coordinates (latitude, longitude)
                                <input
                                    required
                                    value={form.data.coordinates}
                                    onChange={(e) =>
                                        form.setData(
                                            'coordinates',
                                            e.target.value,
                                        )
                                    }
                                    className="rounded-lg border p-2"
                                />
                            </label>
                            <label className="grid gap-1">
                                Radius in meters
                                <input
                                    required
                                    type="number"
                                    min="5"
                                    max="1000"
                                    value={form.data.radius}
                                    onChange={(e) =>
                                        form.setData(
                                            'radius',
                                            Number(e.target.value),
                                        )
                                    }
                                    className="rounded-lg border p-2"
                                />
                            </label>
                            <label className="grid gap-1">
                                Status
                                <select
                                    value={form.data.status}
                                    onChange={(e) =>
                                        form.setData('status', e.target.value)
                                    }
                                    className="rounded-lg border p-2"
                                >
                                    {['Scheduled', 'Ongoing', 'Completed'].map(
                                        (item) => (
                                            <option key={item}>{item}</option>
                                        ),
                                    )}
                                </select>
                            </label>
                            <div className="flex flex-wrap gap-3 sm:col-span-2">
                                {days.map((item) => (
                                    <label
                                        key={item}
                                        className="flex items-center gap-1"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.data.days.includes(
                                                item,
                                            )}
                                            onChange={(e) =>
                                                form.setData(
                                                    'days',
                                                    e.target.checked
                                                        ? [
                                                              ...form.data.days,
                                                              item,
                                                          ]
                                                        : form.data.days.filter(
                                                              (entry) =>
                                                                  entry !==
                                                                  item,
                                                          ),
                                                )
                                            }
                                        />
                                        {item}
                                    </label>
                                ))}
                            </div>
                            <button
                                type="submit"
                                className="rounded-lg bg-[#970027] p-3 font-semibold text-white sm:col-span-2"
                            >
                                {form.processing ? 'Saving…' : 'Save Schedule'}
                            </button>
                        </fieldset>
                    </form>
                </div>
            )}
        </>
    );
}
