/**
 * Returns a random entry in an array
 * @param array the array to return from
 * @returns the randomly selected item
 */
export function randomEntry<T>(array: T[]): T {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}
