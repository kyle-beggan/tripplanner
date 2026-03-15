export function formatPhoneNumber(value: string): string {
    const numbers = value.replace(/\D/g, '');

    // Limit to 10 digits
    const truncated = numbers.slice(0, 10);

    // Format: 555-555-5555
    if (truncated.length > 6) {
        return `${truncated.slice(0, 3)}-${truncated.slice(3, 6)}-${truncated.slice(6)}`;
    }
    if (truncated.length > 3) {
        return `${truncated.slice(0, 3)}-${truncated.slice(3)}`;
    }
    return truncated;
}
