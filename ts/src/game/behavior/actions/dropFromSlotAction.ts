import { log } from "../../../common/logging/logger.ts";
import type { Point } from "../../../common/point.ts";
import { pointEquals } from "../../../common/point.ts";
import { EquipmentComponentId } from "../../component/equipmentComponent.ts";
import { markStatsDirty } from "../../component/statsComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { dropItemAtPosition, DropMode } from "../dropItem.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";

/**
 * Drop an item from an equipment slot directly to the ground at the
 * worker's position, bypassing held. Used when held already contains
 * something incompatible and we need to evict a slot without disturbing
 * held — for example during equip swap.
 */
export type DropFromSlotActionData = {
    type: "dropFromSlot";
    slot: "primary" | "secondary";
    destination: Point;
};

export function executeDropFromSlotAction(
    action: DropFromSlotActionData,
    entity: Entity,
): ActionResult {
    const equipment = entity.getEcsComponent(EquipmentComponentId);
    if (!equipment) {
        log.warn(`Entity ${entity.id} has no equipment component`);
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const slotItem = equipment.slots[action.slot];
    if (!slotItem) {
        // Nothing to drop — treat as success.
        return ActionComplete;
    }

    if (!pointEquals(entity.worldPosition, action.destination)) {
        log.warn(
            `Worker ${entity.id} not at drop destination (${action.destination.x},${action.destination.y})`,
        );
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const root = entity.getRootEntity();
    dropItemAtPosition(
        root,
        action.destination,
        slotItem,
        1,
        `Evicted ${slotItem.name} from ${action.slot} slot to equip a different item`,
        DropMode.Nearest,
    );
    equipment.slots[action.slot] = null;

    entity.invalidateComponent(EquipmentComponentId);
    markStatsDirty(entity);

    return ActionComplete;
}
