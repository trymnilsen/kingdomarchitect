import { log } from "../../../common/logging/logger.ts";
import { ItemTag } from "../../../data/inventory/inventoryItem.ts";
import { EquipmentComponentId } from "../../component/equipmentComponent.ts";
import {
    decreaseHunger,
    HungerComponentId,
} from "../../component/hungerComponent.ts";
import { markStatsDirty } from "../../component/statsComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";

export type EatFromEquipmentActionData = {
    type: "eatFromEquipment";
    slot: "primary" | "secondary";
};

const HUNGER_REDUCTION = 30;

/**
 * Eat a food item out of an equipment slot. Equipment slots are single-
 * unit (no quantity field), so consuming a slot food clears the slot
 * regardless of whether the food id stacks elsewhere — equipping a single
 * loaf of bread is one meal, no more.
 */
export function executeEatFromEquipmentAction(
    action: EatFromEquipmentActionData,
    entity: Entity,
): ActionResult {
    const equipment = entity.getEcsComponent(EquipmentComponentId);
    if (!equipment) {
        return { kind: "failed", cause: { type: "noResources" } };
    }
    const slotItem = equipment.slots[action.slot];
    if (!slotItem || !slotItem.tag?.includes(ItemTag.Food)) {
        return { kind: "failed", cause: { type: "noResources" } };
    }

    equipment.slots[action.slot] = null;
    entity.invalidateComponent(EquipmentComponentId);
    markStatsDirty(entity);

    const hungerComp = entity.getEcsComponent(HungerComponentId);
    if (hungerComp) {
        decreaseHunger(hungerComp, HUNGER_REDUCTION);
        entity.invalidateComponent(HungerComponentId);
    } else {
        log.warn(`Entity ${entity.id} ate but has no HungerComponent`);
    }

    return ActionComplete;
}
