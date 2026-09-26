import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';

type Role = 'student' | 'instructor' | 'guard' | 'admin';

type User = {
    id: number;
    name: string;
    email: string;
    role: Role | string;
    year: string;
    section: string;
    adviser: string;
    status: 'Active' | 'Inactive';
};

type PageProps = {
    users: User[];
};

export default function Users() {
    const { users = [] } = usePage().props as unknown as PageProps;

    const [search, setSearch] = useState('');
    const [role, setRole] = useState('All Roles');
    const [year, setYear] = useState('All Years');
    const [section, setSection] = useState('All Sections');
    const [showModal, setShowModal] = useState(false);

    const [assignYear, setAssignYear] = useState('');
    const [assignSection, setAssignSection] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'instructor' as Role,
        year: '—',
        section: '—',
        adviser: '—',
        status: 'Active' as 'Active' | 'Inactive',
    });

    const instructors = users.filter(
        (user) => user.role?.toLowerCase() === 'instructor',
    );

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const keyword = search.toLowerCase();
            const userRole = user.role?.toLowerCase();

            const matchesSearch =
                user.name.toLowerCase().includes(keyword) ||
                user.email.toLowerCase().includes(keyword) ||
                user.id.toString().includes(keyword);

            const matchesRole =
                role === 'All Roles' || userRole === role.toLowerCase();

            const matchesYear = year === 'All Years' || user.year === year;

            const matchesSection =
                section === 'All Sections' || user.section === section;

            return matchesSearch && matchesRole && matchesYear && matchesSection;
        });
    }, [users, search, role, year, section]);

    const totalUsers = users.length;

    const totalStudents = users.filter(
        (user) => user.role?.toLowerCase() === 'student',
    ).length;

    const totalInstructors = users.filter(
        (user) => user.role?.toLowerCase() === 'instructor',
    ).length;

    const totalGuards = users.filter(
        (user) => user.role?.toLowerCase() === 'guard',
    ).length;

    function createUser(e: React.FormEvent) {
        e.preventDefault();

        router.post('/admin/users', form, {
            onSuccess: () => {
                setShowModal(false);

                setForm({
                    name: '',
                    email: '',
                    password: '',
                    role: 'instructor',
                    year: '—',
                    section: '—',
                    adviser: '—',
                    status: 'Active',
                });
            },
        });
    }

    function openAssignModal() {
        if (!assignYear || !assignSection) {
            alert('Please select year level and section first.');
            return;
        }

        setShowAssignModal(true);
    }

    function assignAdviser(instructor: User) {
        router.put(
            '/admin/users/assign-adviser',
            {
                year: assignYear,
                section: assignSection,
                adviser: instructor.name,
            },
            {
                onSuccess: () => {
                    setShowAssignModal(false);
                    setAssignYear('');
                    setAssignSection('');
                },
            },
        );
    }

    function deleteUser(id: number) {
        if (confirm('Delete this user?')) {
            router.delete(`/admin/users/${id}`);
        }
    }

    return (
        <>
            <Head title="Users" />

            <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-950">
                            User Management
                        </h1>

                        <p className="text-lg text-gray-700">
                            Manage IT students, instructors, guards, and
                            administrators
                        </p>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 rounded-xl bg-red-800 px-6 py-3 text-lg font-bold text-white hover:bg-red-900"
                    >
                        <Plus size={20} />
                        Add User
                    </button>
                </div>

                <div className="mb-5 grid gap-5 md:grid-cols-4">
                    <StatCard title="Total Users" value={totalUsers} />

                    <StatCard
                        title="Students"
                        value={totalStudents}
                        color="text-green-600"
                    />

                    <StatCard
                        title="Instructors"
                        value={totalInstructors}
                        color="text-red-700"
                    />

                    <StatCard
                        title="Guards"
                        value={totalGuards}
                        color="text-orange-600"
                    />
                </div>

                <div className="mb-5 rounded-xl border bg-white p-5 shadow-sm">
                    <div className="grid gap-4 lg:grid-cols-[1fr_140px_140px_160px]">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, email, or ID..."
                                className="w-full rounded-xl border px-12 py-3 text-lg text-gray-900 outline-none focus:border-red-800"
                            />
                        </div>

                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="rounded-xl border bg-white px-4 py-3 text-lg text-gray-900"
                        >
                            <option>All Roles</option>
                            <option>student</option>
                            <option>instructor</option>
                            <option>guard</option>
                            <option>admin</option>
                        </select>

                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="rounded-xl border bg-white px-4 py-3 text-lg text-gray-900"
                        >
                            <option>All Years</option>
                            <option>1st Year</option>
                            <option>2nd Year</option>
                            <option>3rd Year</option>
                            <option>4th Year</option>
                            <option>—</option>
                        </select>

                        <select
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            className="rounded-xl border bg-white px-4 py-3 text-lg text-gray-900"
                        >
                            <option>All Sections</option>
                            <option>A</option>
                            <option>B</option>
                            <option>C</option>
                            <option>—</option>
                        </select>
                    </div>

                    <div className="mt-5 border-t pt-5">
                        <div className="grid items-center gap-4 lg:grid-cols-[130px_1fr_1fr_260px]">
                            <label className="text-lg font-bold text-gray-800">
                                Assign Adviser:
                            </label>

                            <select
                                value={assignYear}
                                onChange={(e) => setAssignYear(e.target.value)}
                                className="rounded-xl border bg-white px-4 py-3 text-lg text-gray-900"
                            >
                                <option value="">Year Level</option>
                                <option>1st Year</option>
                                <option>2nd Year</option>
                                <option>3rd Year</option>
                                <option>4th Year</option>
                            </select>

                            <select
                                value={assignSection}
                                onChange={(e) =>
                                    setAssignSection(e.target.value)
                                }
                                className="rounded-xl border bg-white px-4 py-3 text-lg text-gray-900"
                            >
                                <option value="">Section</option>
                                <option>A</option>
                                <option>B</option>
                                <option>C</option>
                            </select>

                            <button
                                type="button"
                                onClick={openAssignModal}
                                className="rounded-xl bg-red-800 px-6 py-3 text-lg font-bold text-white hover:bg-red-900"
                            >
                                Assign Adviser
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                    <table className="w-full table-fixed text-left">
                        <thead className="bg-gray-50 text-sm font-bold uppercase tracking-wide text-gray-600">
                            <tr>
                                <th className="w-[26%] px-6 py-5">User</th>
                                <th className="w-[13%] px-6 py-5">Role</th>
                                <th className="w-[10%] px-6 py-5">Year</th>
                                <th className="w-[10%] px-6 py-5">Section</th>
                                <th className="w-[19%] px-6 py-5">Adviser</th>
                                <th className="w-[12%] px-6 py-5">Status</th>
                                <th className="w-[10%] px-6 py-5">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-t">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-700">
                                                    {user.name.charAt(0)}
                                                </div>

                                                <div>
                                                    <h3 className="font-bold text-gray-950">
                                                        {user.name}
                                                    </h3>

                                                    <p className="text-sm text-gray-600">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-5">
                                            <span
                                                className={`rounded-full px-3 py-2 text-sm font-bold ${roleColor(
                                                    user.role,
                                                )}`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>

                                        <td className="px-6 py-5 text-gray-800">
                                            {user.year || '—'}
                                        </td>

                                        <td className="px-6 py-5 text-gray-800">
                                            {user.section || '—'}
                                        </td>

                                        <td className="px-6 py-5 text-gray-800">
                                            {user.adviser || '—'}
                                        </td>

                                        <td className="px-6 py-5">
                                            <span
                                                className={`rounded-full px-3 py-2 text-sm font-bold ${
                                                    user.status === 'Active'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                {user.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-5">
                                            <div className="flex gap-4 text-red-800">
                                                <button type="button">
                                                    <Pencil size={20} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        deleteUser(user.id)
                                                    }
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-6 py-12 text-center text-gray-500"
                                    >
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {showAssignModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl">
                            <div className="border-b px-7 py-6">
                                <h2 className="text-2xl font-bold text-gray-950">
                                    Assign Adviser to {assignYear} - Section{' '}
                                    {assignSection}
                                </h2>
                            </div>

                            <div className="px-7 py-6">
                                <p className="mb-5 text-gray-600">
                                    Select an instructor to assign as adviser:
                                </p>

                                <div className="space-y-3">
                                    {instructors.length > 0 ? (
                                        instructors.map((instructor) => (
                                            <button
                                                key={instructor.id}
                                                type="button"
                                                onClick={() =>
                                                    assignAdviser(instructor)
                                                }
                                                className="w-full rounded-xl border p-5 text-left hover:border-red-800 hover:bg-red-50"
                                            >
                                                <h3 className="text-lg font-bold text-gray-950">
                                                    {instructor.name}
                                                </h3>

                                                <p className="font-semibold text-gray-600">
                                                    {instructor.email}
                                                </p>
                                            </button>
                                        ))
                                    ) : (
                                        <p className="rounded-xl border p-5 text-center text-gray-500">
                                            No instructors found.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end border-t px-7 py-5">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="rounded-xl bg-gray-100 px-6 py-3 text-lg font-bold text-gray-700 hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <form
                            onSubmit={createUser}
                            className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-950">
                                        Create User Account
                                    </h2>

                                    <p className="text-gray-600">
                                        Admin can create instructor, student,
                                        guard, or admin account.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <input
                                    required
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="Full Name"
                                    className="w-full rounded-xl border px-4 py-3 text-gray-900"
                                />

                                <input
                                    required
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            email: e.target.value,
                                        })
                                    }
                                    placeholder="Email Address"
                                    className="w-full rounded-xl border px-4 py-3 text-gray-900"
                                />

                                <input
                                    required
                                    type="password"
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            password: e.target.value,
                                        })
                                    }
                                    placeholder="Temporary Password"
                                    className="w-full rounded-xl border px-4 py-3 text-gray-900"
                                />

                                <select
                                    value={form.role}
                                    onChange={(e) => {
                                        const selectedRole = e.target
                                            .value as Role;

                                        setForm({
                                            ...form,
                                            role: selectedRole,
                                            year:
                                                selectedRole === 'student'
                                                    ? '1st Year'
                                                    : '—',
                                            section:
                                                selectedRole === 'student'
                                                    ? 'A'
                                                    : '—',
                                            adviser:
                                                selectedRole === 'student'
                                                    ? ''
                                                    : '—',
                                        });
                                    }}
                                    className="w-full rounded-xl border bg-white px-4 py-3 text-gray-900"
                                >
                                    <option value="instructor">
                                        instructor
                                    </option>
                                    <option value="student">student</option>
                                    <option value="guard">guard</option>
                                    <option value="admin">admin</option>
                                </select>

                                {form.role === 'student' && (
                                    <div className="grid grid-cols-3 gap-3">
                                        <select
                                            value={form.year}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    year: e.target.value,
                                                })
                                            }
                                            className="rounded-xl border bg-white px-4 py-3 text-gray-900"
                                        >
                                            <option>1st Year</option>
                                            <option>2nd Year</option>
                                            <option>3rd Year</option>
                                            <option>4th Year</option>
                                        </select>

                                        <select
                                            value={form.section}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    section: e.target.value,
                                                })
                                            }
                                            className="rounded-xl border bg-white px-4 py-3 text-gray-900"
                                        >
                                            <option>A</option>
                                            <option>B</option>
                                            <option>C</option>
                                        </select>

                                        <input
                                            value={form.adviser}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    adviser: e.target.value,
                                                })
                                            }
                                            placeholder="Adviser"
                                            className="rounded-xl border px-4 py-3 text-gray-900"
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full rounded-xl bg-red-800 px-6 py-3 text-lg font-bold text-white hover:bg-red-900"
                                >
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </>
    );
}

function StatCard({
    title,
    value,
    color = 'text-gray-950',
}: {
    title: string;
    value: number;
    color?: string;
}) {
    return (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-gray-700">{title}</p>
            <h2 className={`text-3xl font-bold ${color}`}>{value}</h2>
        </div>
    );
}

function roleColor(role: string) {
    const normalizedRole = role.toLowerCase();

    if (normalizedRole === 'student') return 'bg-green-100 text-green-700';
    if (normalizedRole === 'instructor') return 'bg-purple-100 text-purple-700';
    if (normalizedRole === 'guard') return 'bg-orange-100 text-orange-700';
    if (normalizedRole === 'admin') return 'bg-purple-100 text-purple-700';

    return 'bg-gray-100 text-gray-700';
}