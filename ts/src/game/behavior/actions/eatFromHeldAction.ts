import { log } from "../../../common/logging/logger.ts";
import { ItemTag } from "../../../data/inventory/inventoryItem.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import {
    decreaseHunger,
    HungerComponentId,
} from "../../component/hungerComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";

export type EatFromHeldActionData = {
    type: "eatFromHeld";
};

const HUNGER_REDUCTION = 30;

export function executeEatFromHeldAction(
    _action: EatFromHeldActionData,
    entity: Entity,
): ActionResult {
    const held = entity.getEcsComponent(HeldItemComponentId);
    if (!held || isHeldEmpty(held)) {
        return { kind: "failed", cause: { type: "noResources" } };
    }
    if (!held.item!.tag?.includes(ItemTag.Food)) {
        return { kind: "failed", cause: { type: "noResources" } };
    }

    held.amount -= 1;
    if (held.amount <= 0) {
        held.item = null;
        held.amount = 0;
    }
    entity.invalidateComponent(HeldItemComponentId);

    const hungerComp = entity.getEcsComponent(HungerComponentId);
    if (hungerComp) {
        decreaseHunger(hungerComp, HUNGER_REDUCTION);
        entity.invalidateComponent(HungerComponentId);
    } else {
        log.warn(`Entity ${entity.id} ate but has no HungerComponent`);
    }

    return ActionComplete;
}
