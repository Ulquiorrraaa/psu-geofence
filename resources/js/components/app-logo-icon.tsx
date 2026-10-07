import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 40 40"
            role="img"
            aria-label="Pampanga State University Lubao Campus"
            xmlns="http://www.w3.org/2000/svg"
        >
            <image href="/images/psu-lubao-logo.png" width="40" height="40" />
        </svg>
    );
}
