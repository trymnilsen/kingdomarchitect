/**
 * Returns a random entry in an array
 * @param array the array to return from
 * @returns the randomly selected item
 */ export function randomEntry(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}
export function removeItem(array, item) {
    const indexOfItem = array.indexOf(item);
    if (indexOfItem >= 0) {
        array.splice(indexOfItem, 1);
        return true;
    } else {
        return false;
    }
}
export function pushMapEntry(collection, key, item) {
    if (!!collection[key]) {
        collection[key].push(item);
    } else {
        collection[key] = [
            item
        ];
    }
}
