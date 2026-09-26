import { Head, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Clock, MapPin, Pencil, Trash2, Users } from 'lucide-react';

type Schedule = {
    id: number;
    instructor_id?: number;
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
    const { instructors = [] } = usePage().props as PageProps;

    const days = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ];

    const [day, setDay] = useState('Monday');

    const [selectedInstructorId, setSelectedInstructorId] =
        useState<number | null>(null);

    useEffect(() => {
        if (selectedInstructorId === null && instructors.length > 0) {
            setSelectedInstructorId(instructors[0].id);
        }
    }, [instructors, selectedInstructorId]);

    const selectedInstructor =
        instructors.find(
            (instructor) => instructor.id === selectedInstructorId,
        ) ?? null;

    const selectedSchedules = useMemo(() => {
        if (!selectedInstructor) return [];

        return (
            selectedInstructor.schedules?.filter((schedule) =>
                schedule.days?.includes(day),
            ) ?? []
        );
    }, [selectedInstructor, day]);

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

            <div className="relative z-10 min-h-screen space-y-6 bg-white p-6 text-gray-900">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Class Schedules
                        </h1>

                        <p className="text-gray-600">
                            View instructor schedules by day
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 rounded-xl border bg-gray-50 p-4">
                    {days.map((selectedDay) => (
                        <button
                            type="button"
                            key={selectedDay}
                            onClick={() => setDay(selectedDay)}
                            className={`rounded-lg px-4 py-2 font-medium ${
                                day === selectedDay
                                    ? 'bg-red-800 text-white'
                                    : 'border bg-white text-gray-800 hover:bg-gray-100'
                            }`}
                        >
                            {selectedDay}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-6">
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
                                const classes =
                                    countClassesByDay(instructor);

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

                                        <span className="text-gray-500">
                                            ›
                                        </span>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="p-4 text-gray-500">
                                No instructors found.
                            </div>
                        )}
                    </div>

                    <div className="col-span-2 space-y-4">
                        <div className="rounded-xl border bg-white p-4 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900">
                                {selectedInstructor?.name ??
                                    'No instructor selected'}
                            </h2>

                            <p className="text-gray-600">
                                Schedule for {day}
                            </p>
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
                                        <div className="absolute right-4 top-4 flex gap-3 text-gray-700">
                                            <Pencil
                                                className="cursor-pointer hover:text-red-700"
                                                size={18}
                                            />

                                            <Trash2
                                                className="cursor-pointer hover:text-red-700"
                                                size={18}
                                            />
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
                                No schedules found for this instructor on{' '}
                                {day}.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}