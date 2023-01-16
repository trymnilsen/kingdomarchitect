export function from<T>(fn: () => T): T {
    return fn();
}
