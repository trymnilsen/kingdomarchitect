import { createLogger } from "../../../common/logging/logger.ts";
import { EquipmentComponentId } from "../../component/equipmentComponent.ts";
import {
    clearHeldItem,
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import { markStatsDirty } from "../../component/statsComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";

/**
 * Move the worker's held item into an equipment slot. Held must contain
 * exactly 1 unit of an item (the planner is responsible for ensuring
 * this) and the slot must be empty (planner evicts first).
 */
export type EquipFromHeldActionData = {
    type: "equipFromHeld";
    slot: "primary" | "secondary";
};

const log = createLogger("behavior");

export function executeEquipFromHeldAction(
    action: EquipFromHeldActionData,
    entity: Entity,
): ActionResult {
    const equipment = entity.getEcsComponent(EquipmentComponentId);
    const held = entity.getEcsComponent(HeldItemComponentId);

    if (!equipment || !held) {
        log.warn(`Entity ${entity.id} missing equipment or held component`);
        return { kind: "failed", cause: { type: "unknown" } };
    }

    if (isHeldEmpty(held)) {
        log.warn(`Entity ${entity.id} has no held item to equip`);
        return { kind: "failed", cause: { type: "unknown" } };
    }

    if (held.amount !== 1) {
        log.warn(
            `equipFromHeld requires held amount of 1, got ${held.amount}`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    if (equipment.slots[action.slot] !== null) {
        log.warn(
            `Slot ${action.slot} on ${entity.id} is occupied; planner should have evicted`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    equipment.slots[action.slot] = held.item;
    clearHeldItem(held);

    entity.invalidateComponent(EquipmentComponentId);
    entity.invalidateComponent(HeldItemComponentId);
    markStatsDirty(entity);

    return ActionComplete;
}
