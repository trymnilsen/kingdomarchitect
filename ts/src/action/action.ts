export interface Action<T = any> {
    name: string[];
    data: T;
}
export function action<T extends {}>(name: string[], data: T): Action<T> {
    return {
        name,
        data
    };
}

export function nameStartsWith(start: string | string[], array: string[]) {
    if (!start) {
        return false;
    }
    if (!Array.isArray(start)) {
        start = [start];
    }
    if (start.length > array.length) {
        return false;
    }
    let potentialMatch = false;
    for (let i = 0; i < start.length; i++) {
        potentialMatch = start[i] === array[i];
        if (!potentialMatch) {
            break;
        }
    }
    return potentialMatch;
}
