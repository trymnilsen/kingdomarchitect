import type { Point } from "../../../common/point.ts";
import type { InventoryItem } from "../../../data/inventory/inventoryItem.ts";
import type { Entity } from "../../entity/entity.ts";
import { findAcceptingStockpile } from "../../entity/findAcceptingStockpile.ts";
import type { ActionResult } from "./action.ts";

// Stockpiles first so freeing a hand does not litter, dropping only when none accepts
export function freeHandSubaction(
    worker: Entity,
    heldItem: InventoryItem,
    workSite: Point,
    workName: string,
): ActionResult {
    const stockpile = findAcceptingStockpile(worker, heldItem.id);
    if (stockpile) {
        return {
            kind: "subaction",
            actions: [
                {
                    type: "moveTo",
                    target: stockpile.worldPosition,
                    goal: { kind: "adjacent" },
                },
                {
                    type: "depositToStockpile",
                    stockpileId: stockpile.id,
                },
                {
                    type: "moveTo",
                    target: workSite,
                    goal: { kind: "adjacent" },
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
