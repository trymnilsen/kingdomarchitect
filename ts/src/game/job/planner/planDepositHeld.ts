import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { findAcceptingStockpile } from "../../entity/findAcceptingStockpile.ts";
import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";

/**
 * Build the action sequence that drains the worker's held slot before
 * starting a job that needs to write into it. If a stockpile in the
 * settlement accepts the held item, walk there and deposit. Otherwise drop
 * the item where the worker stands so the slot is freed and the job can
 * proceed without deadlocking.
 */
export function planDepositHeld(worker: Entity): BehaviorActionData[] {
    const held = worker.getEcsComponent(HeldItemComponentId);
    if (!held || isHeldEmpty(held)) {
        return [];
    }

    const stockpile = findAcceptingStockpile(worker, held.item!.id);
    if (stockpile) {
        return [
            {
                type: "moveTo",
                target: stockpile.worldPosition,
                stopAdjacent: "cardinal",
            },
            {
                type: "depositToStockpile",
                stockpileId: stockpile.id,
            },
        ];
    }

    return [{ type: "dropHeld" }];
}
