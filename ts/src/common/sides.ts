export type Sides = {
    top: number;
    left: number;
    right: number;
    bottom: number;
};

export const HorizontalSide = {
    Left: 0,
    Right: 1,
} as const;

export type HorizontalSide = typeof HorizontalSide[keyof typeof HorizontalSide];

export const VerticalSide = {
    Up: 0,
    Down: 1,
} as const;

export type VerticalSide = typeof VerticalSide[keyof typeof VerticalSide];

export function allSides(size: number): Sides {
    return {
        top: size,
        left: size,
        right: size,
        bottom: size,
    };
}

export function symmetricSides(horizontal: number, vertical: number): Sides {
    return {
        left: horizontal,
        right: horizontal,
        top: vertical,
        bottom: vertical,
    };
}

export function zeroSides(): Sides {
    return {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    };
}

export function totalHorizontal(sides: Sides): number {
    return sides.left + sides.right;
}

export function totalVertical(sides: Sides): number {
    return sides.top + sides.bottom;
}
