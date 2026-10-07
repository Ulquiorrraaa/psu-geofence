import { Head, Link, router, useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';

export type RecordPage<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
};
export default function AdminRecords<T extends { id: number }>({
    title,
    records,
    columns,
    filters = {},
    choices = {},
}: {
    title: string;
    records: RecordPage<T>;
    columns: { label: string; value: (row: T) => ReactNode }[];
    filters?: Record<string, string>;
    choices?: Record<string, { value: string; label: string }[]>;
}) {
    const form = useForm(filters);

    return (
        <main className="min-h-full space-y-6 bg-[#f7f8fa] p-4 text-gray-900 sm:p-7">
            <Head title={title} />
            <header>
                <h1 className="text-3xl font-bold text-[#850027]">{title}</h1>
                <p className="mt-2 text-gray-600">{records.total} records</p>
            </header>
            <form
                className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    router.get(window.location.pathname, form.data, {
                        preserveState: true,
                    });
                }}
            >
                {Object.keys(filters).map((key) => (
                    <label
                        key={key}
                        className="min-w-0 flex-1 basis-44 space-y-1 text-sm"
                    >
                        <span className="block capitalize">{key}</span>
                        {choices[key] ? (
                            <select
                                className="w-full min-w-0 rounded-lg border p-2"
                                value={form.data[key] || ''}
                                onChange={(event) =>
                                    form.setData(key, event.target.value)
                                }
                            >
                                <option value="">All</option>
                                {choices[key].map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                className="w-full min-w-0 rounded-lg border p-2"
                                type={key === 'date' ? 'date' : 'text'}
                                value={form.data[key] || ''}
                                onChange={(event) =>
                                    form.setData(key, event.target.value)
                                }
                            />
                        )}
                    </label>
                ))}
                <button className="rounded-lg bg-[#850027] px-4 py-2 text-white">
                    Apply filters
                </button>
                <button
                    type="button"
                    className="rounded-lg border px-4 py-2"
                    onClick={() => router.get(window.location.pathname)}
                >
                    Reset
                </button>
            </form>
            <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.label}
                                    className="p-4 whitespace-nowrap"
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {records.data.map((row) => (
                            <tr key={row.id} className="border-t">
                                {columns.map((column) => (
                                    <td key={column.label} className="p-4">
                                        {column.value(row) ?? '—'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {!records.data.length && (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="p-10 text-center text-gray-500"
                                >
                                    No records match these filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <nav aria-label="Pagination" className="flex flex-wrap gap-2">
                {records.links.map((link, index) =>
                    link.url ? (
                        <Link
                            key={index}
                            href={link.url}
                            className={
                                'rounded-lg border px-3 py-2 ' +
                                (link.active
                                    ? 'bg-[#850027] text-white'
                                    : 'bg-white')
                            }
                        >
                            <span
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        </Link>
                    ) : (
                        <span
                            key={index}
                            className="rounded-lg border px-3 py-2 text-gray-400"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ),
                )}
            </nav>
        </main>
    );
}
