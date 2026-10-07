import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import PasswordInput from '@/components/password-input';
import ProfilePictureForm from '@/components/profile-picture-form';

type Profile = {
    name: string;
    email: string;
    phone?: string;
    employee_id?: string;
    department?: string;
    assigned_area?: string;
    role: string;
};
export default function PortalProfile() {
    const { profile } = usePage<{ profile: Profile }>().props;
    const form = useForm({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        employee_id: profile.employee_id || '',
        department: profile.department || '',
        assigned_area: profile.assigned_area || '',
    });
    const password = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const fields = [
        'name',
        'email',
        'phone',
        'employee_id',
        ...(profile.role === 'instructor' ? ['department'] : []),
        ...(profile.role === 'guard' ? ['assigned_area'] : []),
    ] as (keyof typeof form.data)[];
    const labels = {
        name: 'Full name',
        email: 'Email',
        phone: 'Contact number',
        employee_id: 'Employee number',
        department: 'Department',
        assigned_area: 'Assigned area',
    };
    const input = 'w-full min-w-0 rounded-lg border p-3';
    function submit(event: FormEvent) {
        event.preventDefault();
        form.patch('/' + profile.role + '/profile', { preserveScroll: true });
    }

    return (
        <main className="min-h-full w-full min-w-0 bg-[#f7f8fa] px-3 py-4 text-gray-900 sm:px-5 sm:py-6 lg:px-7 lg:py-8 xl:px-8">
            <Head title="My Profile" />
            <div className="w-full min-w-0 space-y-6">
                <header>
                    <h1 className="text-3xl font-bold text-[#850027]">
                        My Profile
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Manage your account information and password.
                    </p>
                </header>
                <ProfilePictureForm />
                <form
                    onSubmit={submit}
                    className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm"
                >
                    <h2 className="text-xl font-bold text-[#850027]">
                        Personal information
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {fields.map((key) => (
                            <label key={key} className="min-w-0 space-y-2">
                                {labels[key]}
                                <input
                                    className={input}
                                    value={form.data[key]}
                                    type={key === 'email' ? 'email' : 'text'}
                                    onChange={(event) =>
                                        form.setData(key, event.target.value)
                                    }
                                    required={key === 'name' || key === 'email'}
                                    maxLength={key === 'phone' ? 40 : 255}
                                />
                                {form.errors[key] && (
                                    <span
                                        role="alert"
                                        className="block text-sm text-red-700"
                                    >
                                        {form.errors[key]}
                                    </span>
                                )}
                            </label>
                        ))}
                    </div>
                    <button
                        disabled={form.processing}
                        className="rounded-lg bg-[#850027] px-5 py-3 text-white disabled:opacity-50"
                    >
                        {form.processing ? 'Saving…' : 'Save changes'}
                    </button>
                </form>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        password.put('/settings/password', {
                            preserveScroll: true,
                            onSuccess: () => password.reset(),
                        });
                    }}
                    className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm"
                >
                    <h2 className="text-xl font-bold text-[#850027]">
                        Change password
                    </h2>
                    {(
                        [
                            'current_password',
                            'password',
                            'password_confirmation',
                        ] as const
                    ).map((key) => (
                        <label className="block space-y-2" key={key}>
                            {key === 'current_password'
                                ? 'Current password'
                                : key === 'password'
                                  ? 'New password'
                                  : 'Confirm new password'}
                            <PasswordInput
                                className={input}
                                value={password.data[key]}
                                onChange={(event) =>
                                    password.setData(key, event.target.value)
                                }
                                autoComplete={
                                    key === 'current_password'
                                        ? 'current-password'
                                        : 'new-password'
                                }
                                required
                            />
                            {password.errors[key] && (
                                <span
                                    role="alert"
                                    className="block text-sm text-red-700"
                                >
                                    {password.errors[key]}
                                </span>
                            )}
                        </label>
                    ))}
                    <button
                        disabled={password.processing}
                        className="rounded-lg bg-[#850027] px-5 py-3 text-white disabled:opacity-50"
                    >
                        {password.processing ? 'Updating…' : 'Update password'}
                    </button>
                </form>
            </div>
        </main>
    );
}
