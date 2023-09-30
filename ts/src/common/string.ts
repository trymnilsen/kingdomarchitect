export function isBlank(value: string) {
    return !value || typeof value !== "string" || !/\S/.test(value);
}
