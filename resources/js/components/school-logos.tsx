export default function SchoolLogos({
    className = '',
}: {
    className?: string;
}) {
    return (
        <div className={'flex shrink-0 items-center gap-3 ' + className}>
            <img
                src="/images/psu-university-logo.jpg"
                alt="Pampanga State University seal"
                width={64}
                height={64}
                className="size-14 shrink-0 rounded-full object-contain sm:size-16"
            />
            <img
                src="/images/psu-lubao-logo.png"
                alt="Pampanga State University Lubao Campus seal"
                width={64}
                height={64}
                className="size-14 shrink-0 rounded-full object-contain sm:size-16"
            />
        </div>
    );
}
