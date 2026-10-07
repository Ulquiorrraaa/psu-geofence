import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import ProfileAvatar from '@/components/profile-avatar';

type Role = 'student' | 'instructor' | 'guard' | 'admin';

type User = {
    id: number;
    profile_picture_url?: string;
    student_id?: string;
    course?: string;
    phone?: string;
    employee_id?: string;
    department?: string;
    assigned_area?: string;
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

const normalizeGroup = (value: string) => value.trim().toLowerCase();
const uniqueGroups = (values: string[]) =>
    Array.from(
        new Map(
            values
                .filter((value) => value?.trim() && value.trim() !== '—')
                .map((value) => [normalizeGroup(value), value.trim()]),
        ).values(),
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

export default function Users() {
    const { users = [] } = usePage().props as unknown as PageProps;

    const { url } = usePage();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);
    const [formError, setFormError] = useState('');
    const mutation = useRef(false);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState(
        new URLSearchParams(url.split('?')[1] || '').get('role') || 'All Roles',
    );
    const [status, setStatus] = useState('');
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
        student_id: '',
        course: '',
        phone: '',
        employee_id: '',
        department: '',
        assigned_area: '',
        role: 'instructor' as Role,
        year: '—',
        section: '—',
        adviser: '—',
        status: 'Active' as 'Active' | 'Inactive',
    });

    const instructors = users.filter(
        (user) =>
            user.role?.toLowerCase() === 'instructor' &&
            user.status === 'Active',
    );

    const studentUsers = users.filter(
        (user) => user.role?.toLowerCase() === 'student',
    );
    const studentYears = uniqueGroups(
        studentUsers.map((user) => user.year || ''),
    );
    const studentSections = uniqueGroups(
        studentUsers.map((user) => user.section || ''),
    );
    const assignSections = uniqueGroups(
        studentUsers
            .filter(
                (user) =>
                    normalizeGroup(user.year || '') ===
                    normalizeGroup(assignYear),
            )
            .map((user) => user.section || ''),
    );
    const assignmentCount = studentUsers.filter(
        (user) =>
            normalizeGroup(user.year || '') === normalizeGroup(assignYear) &&
            normalizeGroup(user.section || '') ===
                normalizeGroup(assignSection),
    ).length;
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const keyword = search.toLowerCase();
            const userRole = user.role?.toLowerCase();

            const matchesSearch =
                user.name.toLowerCase().includes(keyword) ||
                user.email.toLowerCase().includes(keyword) ||
                (user.student_id || '').toLowerCase().includes(keyword) ||
                user.id.toString().includes(keyword);

            const matchesRole =
                role === 'All Roles' || userRole === role.toLowerCase();

            const matchesYear =
                year === 'All Years' ||
                normalizeGroup(user.year || '') === normalizeGroup(year);

            const matchesSection =
                section === 'All Sections' ||
                normalizeGroup(user.section || '') === normalizeGroup(section);

            return (
                matchesSearch &&
                matchesRole &&
                matchesYear &&
                matchesSection &&
                (!status || user.status === status)
            );
        });
    }, [users, search, role, year, section, status]);

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

        if (mutation.current) {
            return;
        }

        mutation.current = true;
        setBusy(true);
        setFormError('');
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setShowModal(false);
                setForm({
                    name: '',
                    email: '',
                    password: '',
                    student_id: '',
                    course: '',
                    phone: '',
                    employee_id: '',
                    department: '',
                    assigned_area: '',
                    role: 'instructor' as Role,
                    year: '',
                    section: '',
                    adviser: '',
                    status: 'Active' as const,
                });
            },
            onError: (errors: Record<string, string>) =>
                setFormError(
                    Object.values(errors)[0] ??
                        'The account could not be saved.',
                ),
            onFinish: () => {
                mutation.current = false;
                setBusy(false);
            },
        };

        if (editingId) {
            router.put('/admin/users/' + editingId, form, options);
        } else {
            router.post('/admin/users', form, options);
        }
    }
    function openAssignModal() {
        setFormError('');

        if (!assignYear || !assignSection || !assignmentCount) {
            setFormError(
                'Choose a year level and section with registered student accounts.',
            );

            return;
        }

        setShowAssignModal(true);
    }

    function assignAdviser(instructor: User) {
        if (mutation.current) {
            return;
        }

        mutation.current = true;
        setBusy(true);
        setFormError('');
        router.put(
            '/admin/users/assign-adviser',
            {
                year: assignYear,
                section: assignSection,
                instructor_id: instructor.id,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowAssignModal(false);
                    setAssignYear('');
                    setAssignSection('');
                },
                onError: (errors) =>
                    setFormError(
                        Object.values(errors)[0] ||
                            'The adviser could not be assigned.',
                    ),
                onFinish: () => {
                    mutation.current = false;
                    setBusy(false);
                },
            },
        );
    }

    return (
        <>
            <Head title="Users" />
            {formError && (
                <p role="alert" className="p-4 text-red-700">
                    {formError}
                </p>
            )}

            <div className="min-h-full bg-[#f7f8fa] p-5 text-gray-900 sm:p-7">
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#8f001f]">
                            User Management
                        </h1>

                        <p className="mt-1 text-base text-gray-600">
                            Manage IT students, instructors, guards, and
                            administrators
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setEditingId(null);
                            setForm({
                                name: '',
                                email: '',
                                password: '',
                                student_id: '',
                                course: '',
                                phone: '',
                                employee_id: '',
                                department: '',
                                assigned_area: '',
                                role: 'instructor',
                                year: '',
                                section: '',
                                adviser: '',
                                status: 'Active',
                            });
                            setFormError('');
                            setShowModal(true);
                        }}
                        className="flex items-center justify-center gap-2 rounded-lg bg-[#970027] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#790020]"
                    >
                        <Plus size={20} />
                        Add User
                    </button>
                </div>

                <div className="mb-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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

                <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="grid gap-4 lg:grid-cols-[1fr_140px_140px_160px]">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500" />

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, email, or ID..."
                                className="w-full rounded-lg border border-gray-300 px-12 py-3 text-base text-gray-900 outline-none focus:border-[#970027]"
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
                            {studentYears.map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>

                        <select
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            className="rounded-xl border bg-white px-4 py-3 text-lg text-gray-900"
                        >
                            <option>All Sections</option>
                            {studentSections.map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-5 border-t pt-5">
                        <div className="grid items-center gap-4 lg:grid-cols-[130px_1fr_1fr_260px]">
                            <label className="text-lg font-bold text-gray-800">
                                Assign Adviser:
                            </label>

                            <select
                                value={assignYear}
                                onChange={(e) => {
                                    setAssignYear(e.target.value);
                                    setAssignSection('');
                                }}
                                className="rounded-xl border bg-white px-4 py-3 text-lg text-gray-900"
                            >
                                <option value="">Year Level</option>
                                {studentYears.map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>

                            <select
                                disabled={!assignYear || busy}
                                value={assignSection}
                                onChange={(e) =>
                                    setAssignSection(e.target.value)
                                }
                                className="rounded-xl border bg-white px-4 py-3 text-lg text-gray-900"
                            >
                                <option value="">Section</option>
                                {assignSections.map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={openAssignModal}
                                disabled={busy || !assignmentCount}
                                className="rounded-lg bg-[#970027] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#790020]"
                            >
                                Assign Adviser
                            </button>
                        </div>
                    </div>
                </div>

                <p className="mb-4 text-sm text-gray-600">
                    Adviser assignment uses existing student records. Choose a
                    year level and section; all matching students will receive
                    the selected adviser.
                </p>
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full min-w-[900px] table-fixed text-left">
                        <thead className="bg-gray-50 text-sm font-bold tracking-wide text-gray-600 uppercase">
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
                                                    <ProfileAvatar
                                                        name={user.name}
                                                        url={
                                                            user.profile_picture_url
                                                        }
                                                        className="size-10"
                                                    />
                                                </div>

                                                <div>
                                                    <h3 className="font-bold text-gray-950">
                                                        <Link
                                                            href={
                                                                '/admin/users/' +
                                                                user.id
                                                            }
                                                        >
                                                            {user.name}
                                                        </Link>
                                                    </h3>

                                                    <p className="text-sm text-gray-600">
                                                        {user.email}
                                                        <span className="block text-xs text-gray-500">
                                                            {[
                                                                user.student_id,
                                                                user.course,
                                                                user.employee_id,
                                                                user.department,
                                                                user.assigned_area,
                                                                user.phone,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(' · ')}
                                                        </span>
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
                                                <button
                                                    disabled={busy}
                                                    type="button"
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                user.status ===
                                                                    'Active'
                                                                    ? 'Deactivate this account and retain its records?'
                                                                    : 'Activate this account?',
                                                            )
                                                        ) {
                                                            setBusy(true);
                                                            router.patch(
                                                                '/admin/users/' +
                                                                    user.id +
                                                                    '/status',
                                                                {
                                                                    status:
                                                                        user.status ===
                                                                        'Active'
                                                                            ? 'Inactive'
                                                                            : 'Active',
                                                                },
                                                                {
                                                                    preserveScroll: true,
                                                                    onFinish:
                                                                        () =>
                                                                            setBusy(
                                                                                false,
                                                                            ),
                                                                    onError: (
                                                                        errors,
                                                                    ) =>
                                                                        setFormError(
                                                                            Object.values(
                                                                                errors,
                                                                            )[0] ||
                                                                                'Unable to update status.',
                                                                        ),
                                                                },
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {user.status === 'Active'
                                                        ? 'Deactivate'
                                                        : 'Activate'}
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`Edit ${user.name}`}
                                                    onClick={() => {
                                                        setEditingId(user.id);
                                                        setForm({
                                                            student_id:
                                                                user.student_id ||
                                                                '',
                                                            course:
                                                                user.course ||
                                                                '',
                                                            phone:
                                                                user.phone ||
                                                                '',
                                                            employee_id:
                                                                user.employee_id ||
                                                                '',
                                                            department:
                                                                user.department ||
                                                                '',
                                                            assigned_area:
                                                                user.assigned_area ||
                                                                '',
                                                            name: user.name,
                                                            email: user.email,
                                                            password: '',
                                                            role: user.role as Role,
                                                            year:
                                                                user.year ?? '',
                                                            section:
                                                                user.section ??
                                                                '',
                                                            adviser:
                                                                user.adviser ??
                                                                '',
                                                            status: user.status,
                                                        });
                                                        setFormError('');
                                                        setShowModal(true);
                                                    }}
                                                >
                                                    <Pencil size={20} />
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

                <div className="mt-4 flex flex-wrap gap-3">
                    <label>
                        Account status{' '}
                        <select
                            className="ml-2 rounded-lg border p-2"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option value="">All statuses</option>
                            <option>Active</option>
                            <option>Inactive</option>
                        </select>
                    </label>
                    {['student', 'instructor', 'guard', 'admin'].map(
                        (value) => (
                            <button
                                key={value}
                                className="rounded-lg border bg-white px-4 py-2 capitalize"
                                onClick={() => setRole(value)}
                            >
                                {value}s
                            </button>
                        ),
                    )}
                </div>
                {showAssignModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl">
                            <div className="border-b px-7 py-6">
                                <h2 className="text-2xl font-bold text-gray-950">
                                    Assign Adviser to {assignmentCount}{' '}
                                    student(s): {assignYear} - Section{' '}
                                    {assignSection}
                                </h2>
                            </div>

                            <div className="px-7 py-6">
                                {formError && (
                                    <p
                                        role="alert"
                                        className="mb-4 text-red-700"
                                    >
                                        {formError}
                                    </p>
                                )}
                                <p className="mb-5 text-gray-600">
                                    {busy
                                        ? 'Assigning adviser…'
                                        : 'Select an active instructor to assign as adviser:'}
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
                                                disabled={busy}
                                                className="w-full rounded-xl border p-5 text-left hover:border-red-800 hover:bg-red-50 disabled:opacity-50"
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
                            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-950">
                                        {editingId
                                            ? 'Edit User Account'
                                            : 'Create User Account'}
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
                                {(
                                    [
                                        'student_id',
                                        'course',
                                        'phone',
                                        'employee_id',
                                        'department',
                                        'assigned_area',
                                    ] as const
                                )
                                    .filter((key) =>
                                        form.role === 'student'
                                            ? [
                                                  'student_id',
                                                  'course',
                                                  'phone',
                                              ].includes(key)
                                            : form.role === 'instructor'
                                              ? [
                                                    'phone',
                                                    'employee_id',
                                                    'department',
                                                ].includes(key)
                                              : form.role === 'guard'
                                                ? [
                                                      'phone',
                                                      'employee_id',
                                                      'assigned_area',
                                                  ].includes(key)
                                                : [
                                                      'phone',
                                                      'employee_id',
                                                  ].includes(key),
                                    )
                                    .map((key) => (
                                        <label
                                            key={key}
                                            className="block text-sm capitalize"
                                        >
                                            {key.replaceAll('_', ' ')}
                                            <input
                                                className="mt-1 w-full rounded-lg border p-3"
                                                value={form[key]}
                                                onChange={(event) =>
                                                    setForm({
                                                        ...form,
                                                        [key]: event.target
                                                            .value,
                                                    })
                                                }
                                            />
                                        </label>
                                    ))}
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
                                    required={!editingId}
                                    minLength={8}
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

                                {formError && (
                                    <p role="alert" className="text-red-700">
                                        {formError}
                                    </p>
                                )}
                                <button
                                    disabled={busy}
                                    type="submit"
                                    className="w-full rounded-lg bg-[#970027] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#790020]"
                                >
                                    {editingId
                                        ? 'Edit Account'
                                        : 'Create Account'}
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
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-gray-700">{title}</p>
            <h2 className={`text-3xl font-bold ${color}`}>{value}</h2>
        </div>
    );
}

function roleColor(role: string) {
    const normalizedRole = role.toLowerCase();

    if (normalizedRole === 'student') {
        return 'bg-green-100 text-green-700';
    }

    if (normalizedRole === 'instructor') {
        return 'bg-purple-100 text-purple-700';
    }

    if (normalizedRole === 'guard') {
        return 'bg-orange-100 text-orange-700';
    }

    if (normalizedRole === 'admin') {
        return 'bg-purple-100 text-purple-700';
    }

    return 'bg-gray-100 text-gray-700';
}
