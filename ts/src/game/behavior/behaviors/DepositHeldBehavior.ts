import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import { findAcceptingStockpile } from "../../entity/findAcceptingStockpile.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import type { Behavior } from "./Behavior.ts";

const UTILITY = 15;

/**
 * DepositHeldBehavior nudges an idle worker carrying something to walk
 * the held item to the nearest stockpile and drop it. Replaces the old
 * pressure-scaled HaulBehavior — the new model is single-item-id held,
 * so there's no "fullness" to scale by. Any task above utility 15
 * preempts this; the worker only auto-deposits when nothing else fits.
 */
export function createDepositHeldBehavior(): Behavior {
    return {
        name: "depositHeld",

        isValid(entity: Entity): boolean {
            const held = entity.getEcsComponent(HeldItemComponentId);
            if (!held || isHeldEmpty(held)) return false;

            const stockpile = findAcceptingStockpile(entity, held.item!.id);
            return stockpile !== null;
        },

        utility(_entity: Entity): number {
            return UTILITY;
        },

        expand(entity: Entity): BehaviorActionData[] {
            const held = entity.getEcsComponent(HeldItemComponentId);
            if (!held || isHeldEmpty(held)) return [];

            const stockpile = findAcceptingStockpile(entity, held.item!.id);
            if (!stockpile) return [];

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
        },
    };
}
