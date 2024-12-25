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

export function randomNumber(max: number, min: number = 0): number {
    if (min >= max) {
        throw new Error(`Min ${min} cannot be equal or larger than max ${max}`);
    }

    if (max < min) {
        throw new Error(`Max ${max} cannot be less than ${min}`);
    }

    const randomFactor = max - min;
    return Math.floor(Math.random() * randomFactor) + min;
}
