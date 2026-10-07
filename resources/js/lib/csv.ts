/** Quote CSV fields and prevent spreadsheet formula execution from user input. */
export function csvCell(value: unknown): string {
    let text = String(value ?? '');

    if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) {
        text = "'" + text;
    }

    return `"${text.replaceAll('"', '""')}"`;
}
