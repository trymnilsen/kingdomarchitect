/**
 * Given an array of offsets for views, shift the placement of following views
 * by the amount of the inserted item. Operates on the array in place
 * @param array the array of placements
 * @param index the index to insert the new placement at
 * @param value the placement to insert
 */ export function insertAndShift(array, index, value) {
    array[index] = value;
    const range = value.end - value.start;
    for(let i = index + 1; i < array.length; i++){
        const offset = array[i];
        const newOffset = {
            start: offset.start + range,
            end: offset.end + range
        };
        array[i] = newOffset;
    }
}
