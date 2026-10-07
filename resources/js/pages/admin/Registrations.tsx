import { usePage } from '@inertiajs/react';
import AdminRecords from '@/components/admin-records';
import type { RecordPage } from '@/components/admin-records';
type Registration = {
    id: number;
    name: string;
    email: string;
    student_number: string;
    year_level: string;
    section: string;
    status: string;
    registered_at: string;
    subject?: string;
    instructor: string;
};
export default function Registrations() {
    const { records, filters } = usePage<{
        records: RecordPage<Registration>;
        filters: Record<string, string>;
    }>().props;

    return (
        <>
            <p className="bg-[#f7f8fa] px-7 pt-6 text-sm text-gray-600">
                Student information registration and class enrollment are
                separate records. Choose the registration type to view each
                independently.
            </p>
            <AdminRecords
                title={
                    filters.kind === 'classes'
                        ? 'Class Registrations'
                        : 'Student Information Registrations'
                }
                records={records}
                filters={filters}
                choices={{
                    kind: [
                        {
                            value: 'information',
                            label: 'Student information registration',
                        },
                        { value: 'classes', label: 'Class enrollment' },
                    ],
                }}
                columns={[
                    { label: 'Student', value: (row) => row.name },
                    {
                        label: 'Student number',
                        value: (row) => row.student_number,
                    },
                    { label: 'Email', value: (row) => row.email },
                    { label: 'Year level', value: (row) => row.year_level },
                    { label: 'Section', value: (row) => row.section },
                    ...(filters.kind === 'classes'
                        ? [
                              {
                                  label: 'Subject',
                                  value: (row: Registration) => row.subject,
                              },
                          ]
                        : []),
                    { label: 'Instructor', value: (row) => row.instructor },
                    { label: 'Status', value: (row) => row.status },
                    {
                        label: 'Registered at',
                        value: (row) =>
                            row.registered_at
                                ? new Date(row.registered_at).toLocaleString(
                                      'en-PH',
                                      { timeZone: 'Asia/Manila' },
                                  )
                                : null,
                    },
                ]}
            />
        </>
    );
}
