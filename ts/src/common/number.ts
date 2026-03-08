/**
 * Linearly interpolates between a and b by t (clamped to [0, 1]).
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * clamp(t, 0, 1);
}

export function clamp(value: number, min: number, max: number): number {
    if (min > max) {
        min = max;
    }
    if (max < min) {
        max = min;
    }

    if (value > max) {
        return max;
    } else if (value < min) {
        return min;
    } else {
        return value;
    }
}
