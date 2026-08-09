import type { Entity } from "../entity/entity.ts";
import { InventoryComponentId } from "../component/inventoryComponent.ts";
import { dropItemAtPosition, DropMode } from "./dropItem.ts";

/**
 * Spill everything an entity is storing onto the ground around it.
 *
 * Shared by the two ways a stocked building can stop existing: the player
 * dismantling it, and it being destroyed under them. Both mean the same thing
 * physically — the walls come down and what was inside ends up in the mud — so
 * they must not drift apart.
 *
 * The source entity is normally still in the world while this runs, so its own
 * footprint blocks placement and DropMode.Nearest rings the goods around it
 * rather than burying them under the wreck.
 *
 * `context` completes the pile's debug reason after the item name, e.g.
 * "spilled from destroyed Stockpile".
 *
 * Returns the number of stacks that found somewhere to land.
 */
export function scatterInventory(
    root: Entity,
    tick: number,
    source: Entity,
    context: string,
): number {
    const inventory = source.getEcsComponent(InventoryComponentId);
    if (!inventory) {
        return 0;
    }

    let scattered = 0;
    for (const stack of [...inventory.items]) {
        if (stack.amount <= 0) {
            continue;
        }
        const placed = dropItemAtPosition(
            root,
            tick,
            source.worldPosition,
            stack.item,
            stack.amount,
            `${stack.item.name} ${context}`,
            DropMode.Nearest,
        );
        if (placed) {
            scattered++;
        }
    }

    // No invalidate / clear: callers remove the source entity right after, which
    // tears down its components anyway.
    return scattered;
}
