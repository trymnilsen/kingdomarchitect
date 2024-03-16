export type IdCounterMap = Record<string, number>;
let ids: IdCounterMap = {};

export function generateId(tag: string): string {
    if (!ids[tag]) {
        ids[tag] = 0;
    }

    const newId = ++ids[tag];
    return `${tag}${newId}`;
}
