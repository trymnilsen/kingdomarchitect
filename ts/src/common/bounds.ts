import { Axis } from "./direction";
import { Point } from "./point";
import { NumberRange } from "./range";

/**
 * Check if the given point is within the given rectangle represented by the
 * x1, y1, x2 and y2 edges. A point on the same coordinate as the edge is
 * considered to be inside the rectangle
 * @param point the point to check
 * @param x1 the left edge
 * @param y1 the upper edge
 * @param x2 the right edge
 * @param y2 the bottom edge
 * @returns if the point is with the rectangle.
 */
export function withinRectangle(
    point: Point,
    x1: number,
    y1: number,
    x2: number,
    y2: number
) {
    return point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2;
}

/**
 * Represents a rectangle larged enough to encompass something.
 */
export interface Bounds {
    /**
     * The north west x component
     */
    x1: number;
    /**
     * The north west y component
     */
    y1: number;
    /**
     * The south east x component
     */
    x2: number;
    /**
     * The south east y component
     */
    y2: number;
}

export function zeroBounds(): Bounds {
    return {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
    };
}

/**
 * Creates a [NumberRange] based on the given [Bounds] along [Axis]
 * @param bounds the bounds to calculate range of
 * @param axis the axis to generate the range of
 * @returns The bounds as a single dimension based of the axis
 */
export function getBoundsAxis(bounds: Bounds, axis: Axis): NumberRange {
    switch (axis) {
        case Axis.XAxis:
            return {
                min: bounds.x1,
                max: bounds.x2,
            };
        case Axis.YAxis:
            return {
                min: bounds.y1,
                max: bounds.y2,
            };
    }
}

/**
 * Get the absolute bounds for a give bounds. This means offsetting the bounds
 * until none of its edges are located at a negative coordinate.
 * @param bounds the bounds to make absolute
 * @returns an object containing the absolute bounds and the offset of needed
 */
export function absBounds(bounds: Bounds): {
    bounds: Bounds;
    offsets: Point;
} {
    const boundsDiffX = 0 - bounds.x1;
    const boundsDiffY = 0 - bounds.y1;

    return {
        bounds: {
            x1: 0,
            y1: 0,
            x2: bounds.x2 + boundsDiffX,
            y2: bounds.y2 + boundsDiffY,
        },
        offsets: {
            x: boundsDiffX,
            y: boundsDiffY,
        },
    };
}

export function normaliseBounds(bounds: Bounds): Bounds {
    return {
        x1: bounds.x1 - bounds.x1,
        y1: bounds.y1 - bounds.y1,
        x2: bounds.x2 - bounds.x1,
        y2: bounds.y2 - bounds.y1,
    };
}

export function sizeOfBounds(bounds: Bounds): Point {
    return {
        x: bounds.x2 - bounds.x1,
        y: bounds.y2 - bounds.y1,
    };
}
