import { Direction, OrdinalDirection } from "../../common/direction.js";
import {
    checkAdjacency,
    getDirection,
    getOrdinalDirectionFromPoints,
    pointEquals,
    type Point,
} from "../../common/point.js";

export type DirectionComponent = {
    id: typeof DirectionComponentId;
    direction: Direction;
    ordinal: OrdinalDirection;
};

export function createDirectionComponent(): DirectionComponent {
    return {
        id: DirectionComponentId,
        direction: Direction.Down,
        ordinal: OrdinalDirection.Southeast,
    };
}

export const DirectionComponentId = "Direction";

/**
 * Updates the direction component based a on a travel from and to
 * @param directionComponent the component to update
 * @param from the point to travel from
 * @param to the point to travel to
 */
export function updateDirectionComponent(
    directionComponent: DirectionComponent,
    from: Point,
    to: Point,
) {
    if (pointEquals(from, to)) return;
    const adjacency = checkAdjacency(from, to);
    if (adjacency) {
        directionComponent.direction = adjacency;
        directionComponent.ordinal = getOrdinalDirectionFromPoints(from, to);
        return;
    }

    //If we got a null from checkAdjacency the point is a bit further away
    //so we need to do a (a little bit) more expensive check
    const direction = getDirection(from, to);
    if (direction) {
        directionComponent.direction = direction;
        directionComponent.ordinal = getOrdinalDirectionFromPoints(from, to);
    } else {
        directionComponent.direction = Direction.Down;
    }
}
