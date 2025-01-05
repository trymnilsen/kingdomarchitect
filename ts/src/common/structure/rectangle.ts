import { Bounds, sizeOfBounds } from "../bounds.js";
export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function intersectRect(a: Rectangle, b: Rectangle): Rectangle | null {
    const xOverlap = Math.max(
        0,
        Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
    );
    const yOverlap = Math.max(
        0,
        Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
    );

    if (xOverlap > 0 && yOverlap > 0) {
        return {
            x: Math.max(a.x, b.x),
            y: Math.max(a.y, b.y),
            width: xOverlap,
            height: yOverlap,
        };
    }
    return null;
}
export function splitRectangle(a: Rectangle, b: Rectangle): Rectangle[] {
    const intersection = intersectRect(a, b);

    if (!intersection) {
        return [a]; // No intersection, return original rectangle
    }

    const result: Rectangle[] = [];

    // Top part
    if (a.y < intersection.y) {
        result.push({
            x: a.x,
            y: a.y,
            width: a.width,
            height: intersection.y - a.y,
        });
    }

    // Bottom part
    if (a.y + a.height > intersection.y + intersection.height) {
        result.push({
            x: a.x,
            y: intersection.y + intersection.height,
            width: a.width,
            height: a.y + a.height - (intersection.y + intersection.height),
        });
    }

    // Left part
    if (a.x < intersection.x) {
        result.push({
            x: a.x,
            y: intersection.y,
            width: intersection.x - a.x,
            height: intersection.height,
        });
    }

    // Right part
    if (a.x + a.width > intersection.x + intersection.width) {
        result.push({
            x: intersection.x + intersection.width,
            y: intersection.y,
            width: a.x + a.width - (intersection.x + intersection.width),
            height: intersection.height,
        });
    }

    return result;
}

export function rect(
    x: number,
    y: number,
    width: number,
    height: number,
): Rectangle {
    return { x, y, width, height };
}

export function rectangleFromBounds(bounds: Bounds): Rectangle {
    const size = sizeOfBounds(bounds);
    return {
        x: bounds.x1,
        y: bounds.y1,
        width: size.x,
        height: size.y,
    };
}
