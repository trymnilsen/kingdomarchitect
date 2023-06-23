export function isBlank(value) {
    return !value || typeof value !== "string" || !/\S/.test(value);
}
