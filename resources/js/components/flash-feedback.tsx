import { usePage } from '@inertiajs/react';

export default function FlashFeedback() {
    const { flash } = usePage<{
        flash?: { success?: string; error?: string };
    }>().props;

    if (!flash?.success && !flash?.error) {
        return null;
    }

    return (
        <div
            role={flash.error ? 'alert' : 'status'}
            className={`border-b px-6 py-3 text-sm ${flash.error ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}
        >
            {flash.error ?? flash.success}
        </div>
    );
}
