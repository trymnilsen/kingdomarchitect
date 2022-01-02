export interface NumberRange {
    min: number;
    max: number;
}

export function rangeRandom(range: NumberRange) {
    return Math.floor(Math.random() * (range.max - range.min)) + range.min;
}

export function rangeDistance(range: NumberRange): number {
    return Math.abs(range.max - range.min);
}
