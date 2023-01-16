/**
 * Returns a random entry in an array
 * @param array the array to return from
 * @returns the randomly selected item
 */
export function randomEntry<T>(array: T[]): T {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

export function removeItem<T>(array: T[], item: T): boolean {
    const indexOfItem = array.indexOf(item);
    if (indexOfItem >= 0) {
        array.splice(indexOfItem, 1);
        return true;
    } else {
        return false;
    }
}

export function pushMapEntry<T>(
    collection: { [id: string]: T[] },
    key: string,
    item: T
) {
    if (!!collection[key]) {
        collection[key].push(item);
    } else {
        collection[key] = [item];
    }
}
