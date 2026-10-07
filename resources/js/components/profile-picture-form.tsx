import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import ProfileAvatar from '@/components/profile-avatar';

export default function ProfilePictureForm() {
    const { auth } = usePage().props;
    const user = auth.user;
    const form = useForm<{ profile_picture: File | null; remove?: boolean }>({
        profile_picture: null,
    });
    const [preview, setPreview] = useState<string | null>(null);
    const [inputKey, setInputKey] = useState(0);
    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);
    const endpoint = '/' + String(user.role) + '/profile/picture';
    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(endpoint, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setPreview(null);
                setInputKey((key) => key + 1);
            },
        });
    }

    return (
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-[#850027]">
                Profile picture
            </h2>
            <form
                onSubmit={submit}
                className="flex flex-wrap items-center gap-4"
            >
                <ProfileAvatar
                    name={user.name}
                    url={preview || user.profile_picture_url}
                    className="size-20"
                />
                <div className="min-w-0 flex-1 basis-60 space-y-2">
                    <label className="block text-sm" htmlFor="profile-picture">
                        JPG, PNG or WEBP, up to 2 MB
                    </label>
                    <input
                        key={inputKey}
                        id="profile-picture"
                        type="file"
                        className="block w-full max-w-full min-w-0 text-sm"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                            const file = event.target.files?.[0] || null;

                            if (file && file.size > 2 * 1024 * 1024) {
                                form.setError(
                                    'profile_picture',
                                    'Choose an image smaller than 2 MB.',
                                );
                                event.target.value = '';
                                form.setData({ profile_picture: null });
                                setPreview(null);

                                return;
                            }

                            form.clearErrors('profile_picture');
                            form.setData({ profile_picture: file });
                            setPreview(file ? URL.createObjectURL(file) : null);
                        }}
                    />
                    {form.errors.profile_picture && (
                        <p role="alert" className="text-sm text-red-700">
                            {form.errors.profile_picture}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-3">
                        <button
                            disabled={
                                form.processing || !form.data.profile_picture
                            }
                            className="rounded-lg bg-[#850027] px-4 py-2 text-white disabled:opacity-50"
                        >
                            {form.processing ? 'Saving…' : 'Save picture'}
                        </button>
                        {user.profile_picture_url && (
                            <button
                                type="button"
                                disabled={form.processing}
                                onClick={() => {
                                    form.transform(() => ({
                                        remove: true,
                                        profile_picture: null,
                                    }));
                                    form.post(endpoint, {
                                        preserveScroll: true,
                                        onFinish: () =>
                                            form.transform((data) => data),
                                        onSuccess: () => {
                                            form.reset();
                                            setPreview(null);
                                            setInputKey((key) => key + 1);
                                        },
                                    });
                                }}
                                className="rounded-lg border px-4 py-2"
                            >
                                Remove picture
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </section>
    );
}
