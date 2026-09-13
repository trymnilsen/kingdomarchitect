import { pointEquals, type Point } from "../../common/point.ts";
import { isImpassableResource } from "../../data/inventory/items/naturalResource.ts";
import { ResourceComponentId } from "../component/resourceComponent.ts";
import { isImpassableStructure } from "../component/traversalComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { queryEntity } from "../map/query/queryEntity.ts";

/**
 * Straight shot between two tiles. Integer Bresenham.
 *
 * Both endpoints are excluded. An attacker can be standing on an impassable
 * tile, and the target is often the wall being shot at
 *
 * A perfect diagonal steps through corners, so two walls meeting at one do not
 * seal the gap.
 */
export function hasLineOfSight(root: Entity, from: Point, to: Point): boolean {
    if (pointEquals(from, to)) {
        return true;
    }

    // A line passing exactly between two tiles rounds towards whichever end it
    // started from, so always trace from the lexicographically smaller one
    let start = from;
    let end = to;
    if (to.x < from.x || (to.x === from.x && to.y < from.y)) {
        start = to;
        end = from;
    }

    let x = start.x;
    let y = start.y;
    const deltaX = Math.abs(end.x - start.x);
    const deltaY = -Math.abs(end.y - start.y);
    let stepX = -1;
    if (start.x < end.x) {
        stepX = 1;
    }
    let stepY = -1;
    if (start.y < end.y) {
        stepY = 1;
    }
    let error = deltaX + deltaY;

    while (true) {
        const doubledError = 2 * error;
        if (doubledError >= deltaY) {
            error += deltaY;
            x += stepX;
        }
        if (doubledError <= deltaX) {
            error += deltaX;
            y += stepY;
        }

        if (x === end.x && y === end.y) {
            return true;
        }
        if (blocksSight(root, { x, y })) {
            return false;
        }
    }
}

/**
 * Buildings and large resources block, units never do. Deliberately not
 * isTileAvailable, which calls a tree passable because a mover can chop it down
 */
function blocksSight(root: Entity, point: Point): boolean {
    for (const entity of queryEntity(root, point)) {
        if (isImpassableStructure(entity)) {
            return true;
        }
        const resource = entity.getEcsComponent(ResourceComponentId);
        if (resource && isImpassableResource(resource.resourceId)) {
            return true;
        }
    }
    return false;
}
