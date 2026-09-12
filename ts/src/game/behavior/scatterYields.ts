import type { Point } from "../../common/point.ts";
import type { NaturalResource } from "../../data/inventory/items/naturalResource.ts";
import type { Entity } from "../entity/entity.ts";
import { DropMode, dropItemAtPosition } from "./dropItem.ts";

/**
 * Put a felled resource's yields on the ground instead of in a worker's hands.
 * DropMode.Nearest walks outward from `position`, so this works whether it is
 * called while the resource still stands (the piles land beside it) or after it
 * is removed (the stump tile itself is free to take them).
 *
 * @param position Where the resource stood.
 */
export function scatterYields(
    root: Entity,
    tick: number,
    resource: NaturalResource,
    position: Point,
    reason: string,
): void {
    for (const yieldItem of resource.yields) {
        dropItemAtPosition(
            root,
            tick,
            position,
            yieldItem.item,
            yieldItem.amount,
            reason,
            DropMode.Nearest,
        );
    }
}
