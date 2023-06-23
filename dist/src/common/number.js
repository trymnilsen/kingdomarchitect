export function clamp(value, min, max) {
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
