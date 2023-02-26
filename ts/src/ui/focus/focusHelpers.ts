import { Direction } from "../../common/direction";
import { InvalidArgumentError } from "../../common/error/invalidArgumentError";
import {
    closestPointOnLine,
    distance,
    manhattanDistance,
    Point,
} from "../../common/point";
import { UIView } from "../uiView";

export function getFocusableViews(rootView: UIView): UIView[] {
    return rootView.getViews((view) => view.isFocusable);
}

/**
 * Checks if the given first view argument is within a given
 * direction (third arg) of the origin of another view (the second argument).
 * The origin position is defined as the center of the origin view, we only
 * consider the center of the origin view, not any of its corners.
 * A view (the first argument) is considered to be in the direction if any or
 * its corners are in the direction.
 *
 * @param view the view to check if is in direction
 * @param originView the view to treat as the origin we check against
 * @param direction the direction we a want to test against
 */
export function isViewInDirection(
    view: UIView,
    originView: UIView,
    direction: Direction
): boolean {
    let testFunction: (point: Point) => boolean;
    switch (direction) {
        case Direction.Left:
            testFunction = (point) => point.x < originView.center.x;
            break;
        case Direction.Right:
            testFunction = (point) => point.x > originView.center.x;
            break;
        case Direction.Up:
            testFunction = (point) => point.y < originView.center.y;
            break;
        case Direction.Down:
            testFunction = (point) => point.y > originView.center.y;
            break;
    }

    const hasCornerInDirection = view.corners.some(testFunction);
    const hasCenterInDirection = testFunction(view.center);
    return hasCornerInDirection && hasCenterInDirection;
}

/**
 * Attempt to find the view in a list of views that has an _edge_ that is
 * considered closest to the fromView. The center of fromView will be used
 * as the position to measure from.
 * @param fromView
 * @param views
 */
export function closestViewByEdge(fromView: UIView, views: UIView[]): UIView {
    if (views.length == 0) {
        throw new InvalidArgumentError("views cannot be empty");
    }
    const viewEdges = views.flatMap((view) => {
        const position = view.screenPosition;
        const size = view.measuredSize;
        if (!size) {
            throw new Error("Cannot find closest edge on unmeasured view");
        }
        //TODO: should we filter out edges that are not in the direction wanted?
        //this would require direction as an argument but can also let us filter out
        //edges that are not aligned with the direction?
        const edges: ViewEdge[] = [
            {
                start: {
                    x: position.x,
                    y: position.y,
                },
                end: {
                    x: position.x + size.width,
                    y: position.y,
                },
                view: view,
            },
            {
                start: {
                    x: position.x + size.width,
                    y: position.y,
                },
                end: {
                    x: position.x + size.width,
                    y: position.y + size.height,
                },
                view: view,
            },
            {
                start: {
                    x: position.x + size.width,
                    y: position.y + size.height,
                },
                end: {
                    x: position.x,
                    y: position.y + size.height,
                },
                view: view,
            },
            {
                start: {
                    x: position.x,
                    y: position.y + size.height,
                },
                end: {
                    x: position.x,
                    y: position.y,
                },
                view: view,
            },
        ];

        return edges;
    });
    const fromViewPoint = fromView.center;
    let closestView: UIView = views[0];
    let closestViewDistance = Number.MAX_SAFE_INTEGER;

    for (const edge of viewEdges) {
        const edgePoint = closestPointOnLine(
            edge.start,
            edge.end,
            fromViewPoint
        );

        //TODO: Can we use distance squared?
        const edgeDistance = manhattanDistance(fromViewPoint, edgePoint);
        if (edgeDistance < closestViewDistance) {
            console.log(
                `Edge was closer with a distance: ${edgeDistance}`,
                edge.view
            );
            closestView = edge.view;
            closestViewDistance = edgeDistance;
        } else {
            console.log(
                `Edge NOT was closer with a distance: ${edgeDistance}`,
                edge.view
            );
        }
    }

    return closestView;
}

type ViewEdge = {
    start: Point;
    end: Point;
    view: UIView;
};
