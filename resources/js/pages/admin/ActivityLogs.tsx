import { usePage } from '@inertiajs/react';
import AdminRecords from '@/components/admin-records';
import type { RecordPage } from '@/components/admin-records';
type Log = {
    id: number;
    actor_name: string;
    role: string;
    action: string;
    subject_type: string;
    subject_id: number;
    created_at: string;
};
export default function ActivityLogs() {
    const { records, filters } = usePage<{
        records: RecordPage<Log>;
        filters: Record<string, string>;
    }>().props;

    return (
        <AdminRecords
            title="System Activity"
            records={records}
            filters={{ search: '', ...filters }}
            columns={[
                { label: 'User', value: (row) => row.actor_name },
                { label: 'Role', value: (row) => row.role },
                { label: 'Action', value: (row) => row.action },
                {
                    label: 'Record',
                    value: (row) => row.subject_type + ' #' + row.subject_id,
                },
                {
                    label: 'Date and time',
                    value: (row) =>
                        new Date(row.created_at).toLocaleString('en-PH', {
                            timeZone: 'Asia/Manila',
                        }),
                },
            ]}
        />
    );
}
