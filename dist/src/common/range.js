export function rangeRandom(range) {
    return Math.floor(Math.random() * (range.max - range.min)) + range.min;
}
export function rangeDistance(range) {
    return Math.abs(range.max - range.min);
}
