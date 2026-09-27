import type { InventoryItem } from "../../../data/inventory/inventoryItem.ts";
import type { Entity } from "../../entity/entity.ts";
import { findAcceptingStockpile } from "../../entity/findAcceptingStockpile.ts";
import type { ActionResult } from "./action.ts";

/**
 * Stockpiles first so freeing a hand does not litter, dropping only when none
 * accepts. The suspended work resumes once the hand is free, and its own
 * approach walks the worker back to it from the stockpile.
 */
export function freeHandSubaction(
    worker: Entity,
    heldItem: InventoryItem,
    workName: string,
): ActionResult {
    const stockpile = findAcceptingStockpile(worker, heldItem.id);
    if (stockpile) {
        return {
            kind: "subaction",
            actions: [
                {
                    type: "depositToStockpile",
                    stockpileId: stockpile.id,
                },
            ],
        };
    }

    return {
        kind: "subaction",
        actions: [
            {
                type: "dropHeld",
                reason: `Dropped ${heldItem.name} to free hands for ${workName}`,
            },
        ],
    };
}
