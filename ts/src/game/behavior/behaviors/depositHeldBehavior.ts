import { pointEquals, type Point } from "../../../common/point.ts";
import type { InventoryItem } from "../../../data/inventory/inventoryItem.ts";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import { findAcceptingStockpile } from "../../entity/findAcceptingStockpile.ts";
import type { Entity } from "../../entity/entity.ts";
import { findDropPosition } from "../dropItem.ts";
import type { BehaviorActionData } from "../actions/actionData.ts";
import type { Behavior } from "./behavior.ts";

const UTILITY = 15;

/**
 * Empties an idle worker's hands so they can take new jobs.
 *
 * Delivers carried items to an accepting stockpile when possible. If no
 * stockpile can take the item (none built yet, full, or filtered out),
 * drops it on a nearby tile to avoid deadlocking the worker in idle.
 */
export function createDepositHeldBehavior(): Behavior {
    return {
        name: "depositHeld",

        isValid(entity: Entity): boolean {
            const held = entity.getEcsComponent(HeldItemComponentId);
            if (!held || isHeldEmpty(held)) return false;

            const stockpile = findAcceptingStockpile(entity, held.item!.id);
            if (stockpile !== null) return true;

            const root = entity.getRootEntity();
            return (
                resolveDropTarget(root, entity.worldPosition, held.item!) !==
                null
            );
        },

        utility(_entity: Entity): number {
            return UTILITY;
        },

        expand(entity: Entity): BehaviorActionData[] {
            const held = entity.getEcsComponent(HeldItemComponentId);
            if (!held || isHeldEmpty(held)) return [];

            const stockpile = findAcceptingStockpile(entity, held.item!.id);
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

            const root = entity.getRootEntity();
            const item = held.item!;
            const dropPos = resolveDropTarget(root, entity.worldPosition, item);
            if (!dropPos) {
                return [];
            }

            const reason = `No accepting stockpile available for ${item.name}`;
            if (pointEquals(entity.worldPosition, dropPos)) {
                return [
                    {
                        type: "dropHeld",
                        destination: dropPos,
                        reason,
                    },
                ];
            }

            return [
                {
                    type: "moveTo",
                    target: dropPos,
                },
                {
                    type: "dropHeld",
                    destination: dropPos,
                    reason,
                },
            ];
        },
    };
}

/**
 * Resolve where a fallback drop should land. When the root entity carries a
 * chunk map (real gameplay and spatial test worlds), searches for the nearest
 * legal, walkable, unblocked tile. In minimal unit test setups without a chunk map,
 * falls back to the worker's current position.
 */
function resolveDropTarget(
    root: Entity,
    workerPosition: Point,
    item: InventoryItem,
): Point | null {
    if (root.hasComponent(ChunkMapComponentId)) {
        return findDropPosition(root, workerPosition, item);
    }
    return workerPosition;
}
