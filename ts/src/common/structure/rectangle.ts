import { type Bounds, sizeOfBounds, withinRectangle } from "../bounds.ts";
import type { Point } from "../point.ts";

/**
 * An axis aligned box given by its top left corner plus a size.
 *
 * Use this when a caller wants an origin and an extent. `Bounds` describes the
 * same shape as two corners and suits containment checks better;
 * {@link rectangleFromBounds} converts.
 *
 * Width and height are declared inline rather than reusing the UI layer's
 * `UISize`, which would point `common/` at `ui/` and drag the `fillUiSize`
 * layout contract into geometry code that has no use for it.
 */
export type Rectangle = Point & { width: number; height: number };

/**
 * Whether the point falls inside the rectangle, edges included.
 */
export function pointWithinRectangle(
    point: Point,
    rectangle: Rectangle,
): boolean {
    return withinRectangle(
        point,
        rectangle.x,
        rectangle.y,
        rectangle.x + rectangle.width,
        rectangle.y + rectangle.height,
    );
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
        return [a];
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
