import { usePage } from '@inertiajs/react';
import AdminRecords from '@/components/admin-records';
import type { RecordPage } from '@/components/admin-records';
type Class = {
    id: number;
    subject: string;
    section: string;
    instructor: string;
    user?: { name: string };
    days: string[];
    start_time: string;
    end_time: string;
    location: string;
    registered_students_count: number;
    status: string;
};
export default function Classes() {
    const { records, filters, instructors } = usePage<{
        records: RecordPage<Class>;
        filters: Record<string, string>;
        instructors: { id: number; name: string }[];
    }>().props;

    return (
        <AdminRecords
            title="Class Management"
            records={records}
            filters={{
                instructor: '',
                section: '',
                day: '',
                status: '',
                ...filters,
            }}
            choices={{
                instructor: instructors.map((user) => ({
                    value: String(user.id),
                    label: user.name,
                })),
                day: [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                ].map((day) => ({ value: day, label: day })),
                status: ['Scheduled', 'Ongoing', 'Completed'].map((status) => ({
                    value: status,
                    label: status,
                })),
            }}
            columns={[
                { label: 'Subject', value: (row) => row.subject },
                { label: 'Section', value: (row) => row.section },
                {
                    label: 'Instructor',
                    value: (row) => row.user?.name || row.instructor,
                },
                { label: 'Days', value: (row) => row.days?.join(', ') },
                { label: 'Start', value: (row) => row.start_time },
                { label: 'End', value: (row) => row.end_time },
                { label: 'Location', value: (row) => row.location },
                {
                    label: 'Registered students',
                    value: (row) => row.registered_students_count,
                },
                {
                    label: 'Status',
                    value: (row) => (
                        <span className="rounded-full bg-gray-100 px-3 py-1">
                            {row.status}
                        </span>
                    ),
                },
            ]}
        />
    );
}
