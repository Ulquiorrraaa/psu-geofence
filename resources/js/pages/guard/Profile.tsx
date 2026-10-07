import PortalProfile from '@/components/portal-profile';
import GuardLayout from '@/layouts/guard-layout';
export default function Profile() {
    return (
        <GuardLayout title="My Profile">
            <PortalProfile />
        </GuardLayout>
    );
}
