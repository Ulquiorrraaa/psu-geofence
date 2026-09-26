import type { ReactNode } from 'react';
import StudentSidebar from '@/components/student-sidebar';

export default function StudentLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#f7f8fa] md:flex">
            <StudentSidebar />
            <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
        </div>
    );
}
