import { createLogger } from "../../../common/logging/logger.ts";
import { isPointAdjacentTo } from "../../../common/point.ts";
import { findFoodInInventory } from "../../../data/inventory/inventoryItemHelpers.ts";
import {
    InventoryComponentId,
    takeInventoryItem,
} from "../../component/inventoryComponent.ts";
import {
    addToHeldItem,
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";

export type StealFoodActionData = {
    type: "stealFood";
    targetEntityId: string;
};

const log = createLogger("behavior");

export function executeStealFoodAction(
    action: StealFoodActionData,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const target = root.findEntity(action.targetEntityId);

    if (!target) {
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.targetEntityId },
        };
    }

    if (!isPointAdjacentTo(entity.worldPosition, target.worldPosition)) {
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const targetInventory = target.getEcsComponent(InventoryComponentId);
    if (!targetInventory) {
        return { kind: "failed", cause: { type: "noResources" } };
    }

    const foodStack = findFoodInInventory(targetInventory);
    if (!foodStack) {
        return { kind: "failed", cause: { type: "noResources" } };
    }

    const selfHeld = entity.requireEcsComponent(HeldItemComponentId);
    if (!isHeldEmpty(selfHeld) && selfHeld.item!.id !== foodStack.item.id) {
        return { kind: "failed", cause: { type: "unknown" } };
    }

    takeInventoryItem(targetInventory, foodStack.item.id, 1);
    target.invalidateComponent(InventoryComponentId);

    addToHeldItem(selfHeld, foodStack.item, 1);
    entity.invalidateComponent(HeldItemComponentId);

    log.info(
        `[StealAction] Entity ${entity.id} stole food from ${action.targetEntityId}`,
    );

    return ActionComplete;
}
