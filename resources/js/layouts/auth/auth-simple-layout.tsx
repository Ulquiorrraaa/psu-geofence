import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({ children }: AuthLayoutProps) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#6f0000]">
            {/* Same simple maroon background as welcome page */}
            <div className="absolute inset-0 bg-[#760000]" />

            {/* Content */}
            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
                <div className="relative w-full max-w-[520px] rounded-[32px] bg-white px-12 py-12 shadow-2xl">
                    {/* Back Button */}
                    <Link
                        href={home()}
                        className="absolute left-6 top-5 flex items-center gap-2 text-[#8b0008] transition hover:text-red-700"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Link>

                    {children}
                </div>
            </div>
        </div>
    );
}