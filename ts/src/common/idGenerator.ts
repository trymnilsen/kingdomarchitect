const ids: { [tag: string]: number } = {};
export function generateId(tag: string): string {
    if (!ids[tag]) {
        ids[tag] = 0;
    }

    const newId = ++ids[tag];
    return `${tag}${newId}`;
}
