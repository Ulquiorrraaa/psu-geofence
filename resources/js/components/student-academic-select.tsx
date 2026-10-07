import type { ComponentProps } from 'react';

export const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export function normalizeYear(value: string | null | undefined): string {
    const year = value?.match(/[1-4]/)?.[0];

    return year ? yearOptions[Number(year) - 1] : (value ?? '');
}

export function sectionForYear(
    section: string | null | undefined,
    year: string,
): string {
    const number = year.match(/[1-4]/)?.[0];
    const letter = (section ?? '')
        .trim()
        .toUpperCase()
        .replace(/^SECTION\s*/i, '')
        .replace(/^[1-4]\s*/, '');

    return number && /^[A-Z]+$/.test(letter)
        ? number + letter
        : (section ?? '');
}

type Props = Omit<ComponentProps<'select'>, 'value'> & {
    field: 'course' | 'year' | 'section';
    value: string;
    year?: string;
};

export default function StudentAcademicSelect({
    field,
    value,
    year = '',
    ...props
}: Props) {
    const number = year.match(/[1-4]/)?.[0];
    const sections = (number ? [number] : ['1', '2', '3', '4']).flatMap(
        (level) => ['A', 'B', 'C'].map((letter) => level + letter),
    );
    const options =
        field === 'year'
            ? yearOptions
            : field === 'section'
              ? sections
              : ['BSIT'];
    const selected =
        field === 'year'
            ? normalizeYear(value)
            : field === 'section'
              ? sectionForYear(value, year)
              : value;
    const available =
        selected && !options.includes(selected)
            ? [...options, selected]
            : options;

    return (
        <select {...props} value={selected}>
            <option value="" disabled>
                Select {field === 'year' ? 'year level' : field}
            </option>
            {available.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
}
