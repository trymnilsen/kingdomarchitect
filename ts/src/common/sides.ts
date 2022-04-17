export interface Sides {
    top: number;
    left: number;
    right: number;
    bottom: number;
}

export function allSides(size: number): Sides {
    return {
        top: size,
        left: size,
        right: size,
        bottom: size,
    };
}
