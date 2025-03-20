import {
    Bounds,
    boundsCenter,
    boundsContains,
    boundsOverlap,
    getCorners,
    sizeOfBounds,
} from "../../../common/bounds.js";
import { Direction, invertDirection } from "../../../common/direction.js";
import { InvalidArgumentError } from "../../../common/error/invalidArgumentError.js";
import {
    addPoint,
    closestPointOnLine,
    manhattanDistance,
    Point,
} from "../../../common/point.js";
import { visitChildren } from "../../../common/visit/visit.js";
import { UIView } from "../uiView.js";

export interface FocusNode {
    bounds: Bounds;
    onFocus(): void;
    onFocusLost(): void;
    onFocusTapActivate(node: FocusNode): boolean;
}

export function getFocusableNodes(rootView: UIView): FocusNode[] {
    const nodes: FocusNode[] = [];
    visitChildren(rootView, (child) => {
        if (!!child.focusNodes && child.focusNodes.length > 0) {
            nodes.push(...child.focusNodes);
        }
        return false;
    });
    return nodes;
}

export function getClosestFocusableNode(
    focusableNodes: FocusNode[],
    currentFocusBounds: Bounds,
    direction: Direction,
): FocusNode | null {
    const adjacentNodes = getPrioritisedNodes(
        focusableNodes,
        currentFocusBounds,
        direction,
    );

    if (adjacentNodes.length > 0) {
        const closestNode = closestNodeByEdge(
            currentFocusBounds,
            adjacentNodes,
        );
        return closestNode;
    } else {
        return null;
    }
}

/**
 * Get the most priorites subsection of views from the given list
 * The views will be extracted based on three priorities.
 * 1. If the view contains/wraps (considered the same thing, potato potato).
 * 2. if the view is partially overlapping
 * 3. If the view is completely past the edgeline of the view
 * The edgeline is the line that aligns width the edge of the view that is most
 * in the direction of the direction.
 * E.g for a left direction, this is the leftmost/western edge. For the down
 * direction this is the bottom/southern edge.
 *
 * The term "most in the direction" will be used to describe the item that is
 * furthest from this edge in the choosen direction.
 * E.g {x: 1, y: 2} is more in direction than {x: 3, y: 1} if the
 * direction is left
 *
 * Below is the three conditions described as a diagram
 *
 *
 * For all examples
 * Wanted Direction is right
 * +---------------->
 *                                                           '
 * 
 * 1: Potential views that contain/wrap the currently focused
 * view (cfv)
 * 
 * ````
 *                     EdgeLine
 *      Potential     +
 *      View          |
 *         +---+    +---------------------------+
 *             |    | |                         |
 *             v    | |                         |
 * Currently x-+----------x <---+               | <--+
 * Focused   |      | |   |   Any corner(x)     |  Screen
 * View      |   +----+   |   beyond edge line  |  Bounds
 *      +------->+  | |   |                     |
 *           |   +----+   |   all corners are   |
 *           |      | |   |   outside of cfv    |
 *           |      | |   |                     |
 *           x------------x                     |
 *                  | |                         |
 *                  +---------------------------+
 *                    |
 *                    +
 * `````
 *
 * 2: Get potential views that overlap cfv but all
 * corners (x) of the potential are further in the
 * direction than the least directionmost corners (y)
 * of the cfv
 * 
 * ````
 *                    + Edgeline
 *                    |
 *                  +---------------------------+
 *                  | |                         |
 *     Currently  x-------x Any corner beyond   |
 *     Focused    | | |   | edgeline            |
 *     View     y-----+   |                     |
 *        +---->| | | |   | Potential view      |
 *              y-----+   | overlaps cfv        |
 *                | | |   |                     |
 *         +----> x-------x All corners are more|
 *         |        | |     in direction        |
 *         +        | |                         |
 *     Potential    +---------------------------+
 *     View           |
 *                    +
 * ````
 * 
 * 3: Get view that have corners(x) that are all more
 *    in the direction than the edgeline of the cfv
 * 
 * ````
 * 
 *                     + Edgeline
 *                     |
 *                   +---------------------------+
 *                   | |                         |
 *                   | |                         |
 *                   | |  x------x               |
 *       Currently   | |  |      |               |
 *       Focused  +----+  |      |               |
 *       View+--->+  | |  x-+----x               |
 *                +----+    ^                    |
 *                   | |    |                    |
 *                   | |    |                    |
 *                   | |    |                    |
 *                   | |    |                    |
 *                   +---------------------------+
 *                     |    |
 *                     |    + Potential view
 *                     +
 * ````
 * 
 * Not Valid Example: None of the three cases above
 * 
 * ````
 *                     + Edgeline
 *                   +---------------------------+
 *    Potential   +-------+                      |
 *    View        |  | |  |  Not wrapping        |
 *    +---------->+  | |  |  or containing       |
 *                +-------+                      |
 *    Currently      | |     Not overlapping     |
 *    Focused      +---+                         |
 *    View         | | |     Not completely past |
 *     +---------> +---+     the edgeline in     |
 *                   | |     the direction       |
 *                   | |                         |
 *                   | |                         |
 *                   | |                         |
 *                   +---------------------------+
 *                     |
 *                     +
 * ````
 * 
 * **Note**: This example is applicable for the up
 * direction as in that case it would have
 * all its four corners (x) past the edgeline
 * that would be aligned on the top of the cfv

 *
 * @param focusableNodes the views to check if are applicable
 * @param currentFocusBounds the currently focused bounds we are moving away from
 * @param direction the direction we are moving in
 * @returns a list view views that are considered the best candidates to move to
 */
function getPrioritisedNodes(
    focusableNodes: FocusNode[],
    currentFocusBounds: Bounds,
    direction: Direction,
): FocusNode[] {
    const viewsInDirection = focusableNodes.filter((view) => {
        return isViewInDirection(
            view,
            boundsCenter(currentFocusBounds),
            direction,
        );
    });

    const wrappingViews = viewsInDirection.filter((view) => {
        return boundsContains(view.bounds, currentFocusBounds);
    });
    if (wrappingViews.length > 0) {
        return wrappingViews;
    }

    const overlappingViews = viewsInDirection
        .filter((view) => {
            return boundsOverlap(currentFocusBounds, view.bounds);
        })
        .filter((view) => {
            const oppositeDirection = invertDirection(direction);
            const oppositeEdge = getDirectionalEdge(
                view.bounds,
                oppositeDirection,
            );
            const oppositeEdgeOfFocusedView = getDirectionalEdge(
                currentFocusBounds,
                oppositeDirection,
            );

            const corners = [oppositeEdge.start, oppositeEdge.end];
            return corners.every((corner) =>
                isPointPastEdge(
                    direction,
                    corner,
                    oppositeEdgeOfFocusedView.start,
                ),
            );
        });
    if (overlappingViews.length > 0) {
        return overlappingViews;
    }

    const completelyPastEdgeViews = viewsInDirection.filter((view) => {
        //Check that all corners are past the view edge
        const edge = getDirectionalEdge(currentFocusBounds, direction);
        return getCorners(view.bounds).every((corner) =>
            isPointPastEdge(direction, corner, edge.start),
        );
    });

    if (completelyPastEdgeViews.length > 0) {
        return completelyPastEdgeViews;
    }

    // No applicable views
    return [];
}

function getDirectionalEdge(
    viewBounds: Bounds,
    direction: Direction,
): ViewEdge {
    switch (direction) {
        case Direction.Down:
            return {
                start: {
                    x: viewBounds.x2,
                    y: viewBounds.y2,
                },
                end: {
                    x: viewBounds.x1,
                    y: viewBounds.y2,
                },
            };
        case Direction.Up:
            return {
                start: {
                    x: viewBounds.x1,
                    y: viewBounds.y1,
                },
                end: {
                    x: viewBounds.x2,
                    y: viewBounds.y1,
                },
            };
        case Direction.Right:
            return {
                start: {
                    x: viewBounds.x2,
                    y: viewBounds.y1,
                },
                end: {
                    x: viewBounds.x2,
                    y: viewBounds.y2,
                },
            };
        case Direction.Left:
            return {
                start: {
                    x: viewBounds.x1,
                    y: viewBounds.y2,
                },
                end: {
                    x: viewBounds.x1,
                    y: viewBounds.y1,
                },
            };
    }
}

/**
 * Check if the current point is past the edge defined as a point.
 * Based on the direction _either_ the x or y component of the point will
 * be used
 * @param direction
 * @param point
 * @param edge
 * @returns
 */
function isPointPastEdge(
    direction: Direction,
    point: Point,
    edge: Point,
): boolean {
    switch (direction) {
        case Direction.Left:
            return point.x < edge.x;
        case Direction.Right:
            return point.x > edge.x;
        case Direction.Up:
            return point.y < edge.y;
        case Direction.Down:
            return point.y > edge.y;
    }
}

/**
 * Checks if the given first view argument is within a given
 * direction (third arg) of a provided point (the second argument).
 * A view (the first argument) is considered to be in the direction if any or
 * its corners are in the direction.
 *
 * @param view the view to check if is in direction
 * @param point the point to treat as the origin we check against
 * @param direction the direction we a want to test against
 */
function isViewInDirection(
    view: FocusNode,
    origin: Point,
    direction: Direction,
): boolean {
    const hasCornerInDirection = getCorners(view.bounds).some((corner) => {
        return isPointPastEdge(direction, corner, origin);
    });
    return hasCornerInDirection;
}

/**
 * Attempt to find the view in a list of views that has an _edge_ that is
 * considered closest to the from bounds. The center of fromBounds will be used
 * as the position to measure from.
 * @param fromBounds
 * @param views
 */
function closestNodeByEdge(fromBounds: Bounds, views: FocusNode[]): FocusNode {
    if (views.length == 0) {
        throw new InvalidArgumentError("views cannot be empty");
    }
    const fromViewPoint = boundsCenter(fromBounds);
    let closestView: FocusNode = views[0];
    let closestViewDistance = Number.MAX_SAFE_INTEGER;

    for (const view of views) {
        const edges = getViewEdges(view.bounds);
        for (const edge of edges) {
            const edgePoint = closestPointOnLine(
                edge.start,
                edge.end,
                fromViewPoint,
            );

            const edgeDistance = manhattanDistance(fromViewPoint, edgePoint);
            if (edgeDistance < closestViewDistance) {
                closestView = view;
                closestViewDistance = edgeDistance;
            }
        }
    }

    return closestView;
}

function getViewEdges(view: Bounds): ViewEdge[] {
    return [
        {
            start: {
                x: view.x1,
                y: view.y1,
            },
            end: {
                x: view.x2,
                y: view.y1,
            },
        },
        {
            start: {
                x: view.x2,
                y: view.y1,
            },
            end: {
                x: view.x2,
                y: view.y2,
            },
        },
        {
            start: {
                x: view.x2,
                y: view.y2,
            },
            end: {
                x: view.x1,
                y: view.y2,
            },
        },
        {
            start: {
                x: view.x1,
                y: view.y2,
            },
            end: {
                x: view.x1,
                y: view.y1,
            },
        },
    ];
}

type ViewEdge = {
    start: Point;
    end: Point;
};
