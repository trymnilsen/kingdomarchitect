const ids = {};
export function generateId(tag) {
    if (!ids[tag]) {
        ids[tag] = 0;
    }
    const newId = ++ids[tag];
    return `${tag}${newId}`;
}
