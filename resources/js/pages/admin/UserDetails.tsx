import { Link, usePage } from '@inertiajs/react';
import AdminRecords from '@/components/admin-records';
import type { RecordPage } from '@/components/admin-records';
import ProfileAvatar from '@/components/profile-avatar';
type Class = {
    id: number;
    subject: string;
    days: string[];
    start_time: string;
    end_time: string;
    location: string;
};
type Profile = {
    id: number;
    name: string;
    email: string;
    role: string;
    profile_picture_url: string;
    student_id: string;
    course: string;
    year: string;
    section: string;
    status: string;
    employee_id: string;
    department: string;
    phone: string;
    assigned_area: string;
    registered_schedules: Class[];
    schedules: Class[];
    student_registrations: {
        id: number;
        student_number: string;
        registered_at: string;
    }[];
};
type Attendance = {
    id: number;
    schedule?: { subject: string };
    attendance_date: string;
    status: string;
};
export default function UserDetails() {
    const { profile, records, percentage } = usePage<{
        profile: Profile;
        records: RecordPage<Attendance>;
        percentage: number | null;
    }>().props;

    return (
        <>
            <section className="space-y-4 p-5 text-gray-900 sm:p-7">
                <Link className="text-[#850027]" href="/admin/users">
                    Back to users
                </Link>
                <div className="flex min-w-0 flex-wrap items-center gap-4">
                    <ProfileAvatar
                        name={profile.name}
                        url={profile.profile_picture_url}
                        className="size-20"
                    />
                    <div>
                        <h1 className="text-2xl font-bold break-words">
                            {profile.name}
                        </h1>
                        <p className="capitalize">
                            {profile.role} · {profile.status}
                        </p>
                    </div>
                </div>
                <dl className="grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2 xl:grid-cols-3">
                    {(
                        [
                            'email',
                            'student_id',
                            'course',
                            'year',
                            'section',
                            'employee_id',
                            'department',
                            'phone',
                            'assigned_area',
                        ] as const
                    ).map((key) => (
                        <div key={key} className="min-w-0 break-words">
                            <dt className="text-sm text-gray-500 capitalize">
                                {key.replaceAll('_', ' ')}
                            </dt>
                            <dd>{profile[key] || '—'}</dd>
                        </div>
                    ))}
                </dl>
                <h2 className="text-xl font-bold">
                    Registered / assigned classes
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    {[
                        ...profile.registered_schedules,
                        ...profile.schedules,
                    ].map((row) => (
                        <div
                            key={row.id}
                            className="rounded-xl border bg-white p-4"
                        >
                            <strong>{row.subject}</strong>
                            <p>
                                {row.days?.join(', ')} · {row.start_time} –{' '}
                                {row.end_time}
                            </p>
                            <p>{row.location}</p>
                        </div>
                    ))}
                </div>
                {!profile.registered_schedules.length &&
                    !profile.schedules.length && (
                        <p>No classes assigned or registered.</p>
                    )}
                <p>
                    Attendance percentage:{' '}
                    {percentage === null
                        ? 'No attendance records'
                        : percentage + '%'}{' '}
                    <span className="text-sm text-gray-500">
                        (Present + Late / recorded class attendance)
                    </span>
                </p>
                <p>
                    Student information registrations:{' '}
                    {profile.student_registrations.length}
                </p>
            </section>
            <AdminRecords
                title="Attendance History"
                records={records}
                columns={[
                    { label: 'Class', value: (row) => row.schedule?.subject },
                    {
                        label: 'Date',
                        value: (row) => row.attendance_date?.slice(0, 10),
                    },
                    { label: 'Status', value: (row) => row.status },
                ]}
            />
        </>
    );
}
