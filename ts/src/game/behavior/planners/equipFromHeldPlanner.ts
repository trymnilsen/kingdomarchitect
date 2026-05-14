import { EquipmentComponentId } from "../../component/equipmentComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import { findDropPosition } from "../dropItem.ts";

/**
 * Build the action plan for an "equip what I'm already holding" command.
 *
 * If the target slot is empty the plan is a single equipFromHeld step. If
 * the target slot is occupied the slot item is dropped directly to the
 * ground via dropFromSlot — held is never disturbed, so the new item that
 * the player wants equipped survives the swap.
 */
export function planEquipFromHeld(
    root: Entity,
    entity: Entity,
    slot: "primary" | "secondary",
): BehaviorActionData[] {
    const equipment = entity.requireEcsComponent(EquipmentComponentId);
    const slotItem = equipment.slots[slot];

    if (!slotItem) {
        return [
            { type: "equipFromHeld", slot },
            { type: "clearPlayerCommand" },
        ];
    }

    const dropPos = findDropPosition(root, entity.worldPosition, slotItem);
    if (!dropPos) {
        throw new Error(
            `planEquipFromHeld: cannot find drop position for evicted slot ` +
                `item '${slotItem.id}' within radius`,
        );
    }
    return [
        { type: "moveTo", target: dropPos },
        { type: "dropFromSlot", slot, destination: dropPos },
        { type: "equipFromHeld", slot },
        { type: "clearPlayerCommand" },
    ];
}
