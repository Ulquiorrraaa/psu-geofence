import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

type Props = { name?: string | null; url?: string | null; className?: string };

export default function ProfileAvatar({
    name,
    url,
    className = 'size-11',
}: Props) {
    const label = name ? name + ' profile picture' : 'Profile picture';

    if (!url) {
        return (
            <span
                aria-label={name || 'User'}
                className={
                    className +
                    ' inline-flex shrink-0 items-center justify-center rounded-full bg-[#f7dce4] font-bold text-[#850027]'
                }
            >
                {(name || 'U').trim().slice(0, 1).toUpperCase()}
            </span>
        );
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    type="button"
                    aria-label={'View ' + label}
                    title="View profile picture"
                    className={
                        className +
                        ' inline-flex shrink-0 cursor-zoom-in items-center justify-center overflow-hidden rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#850027]'
                    }
                >
                    <img
                        src={url}
                        alt={label}
                        className="h-full w-full rounded-full object-cover"
                    />
                </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] max-w-[calc(100%-2rem)] overflow-y-auto border-white/15 bg-[#171717] p-4 text-white sm:max-w-3xl sm:p-6">
                <DialogTitle className="pr-8 text-left text-base">
                    {label}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Full-size profile picture. Close with the close button,
                    Escape, or by clicking outside the preview.
                </DialogDescription>
                <img
                    src={url}
                    alt={label}
                    className="max-h-[70dvh] w-full rounded-lg object-contain"
                />
            </DialogContent>
        </Dialog>
    );
}
