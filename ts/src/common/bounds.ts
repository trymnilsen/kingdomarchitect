import { Axis } from "./direction.js";
import { Point, addPoint, subtractPoint } from "./point.js";
import { NumberRange } from "./range.js";

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
    y2: number,
) {
    return point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2;
}

/**
 * Represents a rectangle large enough to encompass something.
 */
export type Bounds = {
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
};

export function boundsCenter(bounds: Bounds): Point {
    const width = bounds.x2 - bounds.x1;
    const height = bounds.y2 - bounds.y1;

    return addPoint(
        { x: bounds.x1, y: bounds.y1 },
        { x: width / 2, y: height / 2 },
    );
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

/**
 * Normalises the bounds to start at {0,0} by shifting the components
 * of the bounds
 * @param bounds the bounds to normalise
 * @returns a bounds starting at {0,0}
 */
export function normaliseBounds(bounds: Bounds): Bounds {
    return {
        x1: bounds.x1 - bounds.x1,
        y1: bounds.y1 - bounds.y1,
        x2: bounds.x2 - bounds.x1,
        y2: bounds.y2 - bounds.y1,
    };
}

/**
 * Get the size of the bounds
 * @param bounds the bounds to measure
 * @returns the width and height of the bounds
 */
export function sizeOfBounds(bounds: Bounds): Point {
    return {
        x: bounds.x2 - bounds.x1,
        y: bounds.y2 - bounds.y1,
    };
}

/**
 * Checks if all the edges of the inner bounds are inside the outer bounds
 * @param outer the bounds wrapping the inner bounds
 * @param inner the bounds that should fit inside the outer bounds
 * @returns true if the innerbounds are not outside the outer bounds
 */
export function boundsContains(outer: Bounds, inner: Bounds): boolean {
    return (
        outer.x1 <= inner.x1 &&
        outer.x2 >= inner.x2 &&
        outer.y1 <= inner.y1 &&
        outer.y2 >= inner.y2
    );
}

/**
 * Checks if the first bounds overlap the second bounds
 * @param first the first rectangle
 * @param second the second rectangle to check if overlaps the first
 * @returns if the two bounds overlap
 */
export function boundsOverlap(first: Bounds, second: Bounds): boolean {
    return (
        first.x1 < second.x2 &&
        first.x2 > second.x1 &&
        first.y1 < second.y2 &&
        first.y2 > second.y1
    );
}

export function getBounds(points: Point[]): Bounds {
    if (points.length == 0) {
        return zeroBounds();
    }

    let maxX = Number.MIN_SAFE_INTEGER;
    let minX = Number.MAX_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;

    for (const point of points) {
        if (point.x < minX) {
            minX = point.x;
        }
        if (point.x > maxX) {
            maxX = point.x;
        }
        if (point.y < minY) {
            minY = point.y;
        }
        if (point.y > maxY) {
            maxY = point.y;
        }
    }

    return {
        x1: minX,
        y1: minY,
        x2: maxX,
        y2: maxY,
    };
}

/**
 * Find all the positions where the provided bounds fit within in the container
 * @param container the container to fit the bounds within
 * @param bounds the bounds to attempt to fit within the container
 * @param predicate optional predicate run for each candidate, can be used to
 * filter out options. A truthy value means the candiadate is applicable
 */
export function getAllPositionsBoundsFitWithinBounds(
    container: Point,
    size: Point,
    isApplicablePredicate?: (candidate: Bounds) => boolean,
): Bounds[] {
    //If the bounds are larger than the container no point in trying
    if (container.x < size.x || container.y < size.y) {
        return [];
    }

    const positions: Bounds[] = [];
    // There is no point in searching beyond the size of the container minus the
    // size of the bounds. As the bounds wont fit there without overflowing.
    // e.g a container with the size of 12,12 and a bounds of size 4,4 cannot
    // fit at 9,9 as the x2,y2 coords of the bounds would the be 13,13 and lay
    // outside of the container
    const searchSize = subtractPoint(container, size);
    for (let x = 0; x < searchSize.x; x++) {
        for (let y = 0; y < searchSize.y; y++) {
            const candidate: Bounds = {
                x1: x,
                y1: y,
                x2: x + size.x,
                y2: y + size.y,
            };
            let applicable = true;

            if (isApplicablePredicate) {
                applicable = !!isApplicablePredicate(candidate);
            }

            if (applicable) {
                positions.push(candidate);
            }
        }
    }

    return positions;
}
