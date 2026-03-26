import { createLogger } from "../../../common/logging/logger.ts";
import { findFoodInInventory } from "../../../data/inventory/inventoryItemHelpers.ts";
import {
    InventoryComponentId,
    takeInventoryItem,
} from "../../component/inventoryComponent.ts";
import {
    decreaseHunger,
    HungerComponentId,
} from "../../component/hungerComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";

export type EatFromInventoryActionData = {
    type: "eatFromInventory";
};

const HUNGER_REDUCTION = 30;

const log = createLogger("behavior");

export function executeEatFromInventoryAction(
    _action: EatFromInventoryActionData,
    entity: Entity,
): ActionResult {
    const inventory = entity.getEcsComponent(InventoryComponentId);
    if (!inventory) {
        return { kind: "failed", cause: { type: "noResources" } };
    }

    const foodStack = findFoodInInventory(inventory);
    if (!foodStack) {
        return { kind: "failed", cause: { type: "noResources" } };
    }

    takeInventoryItem(inventory, foodStack.item.id, 1);
    entity.invalidateComponent(InventoryComponentId);

    const hungerComp = entity.getEcsComponent(HungerComponentId);
    if (hungerComp) {
        decreaseHunger(hungerComp, HUNGER_REDUCTION);
        entity.invalidateComponent(HungerComponentId);
    } else {
        log.warn(`Entity ${entity.id} ate but has no HungerComponent`);
    }

    return ActionComplete;
}
