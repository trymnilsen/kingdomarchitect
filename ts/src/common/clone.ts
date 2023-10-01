export function clone<T extends Record<string, unknown>>(object: T): T {
    return Object.assign({}, object);
}
