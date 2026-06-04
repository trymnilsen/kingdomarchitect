import { inventoryItemsMap } from "../../../data/inventory/inventoryItems.ts";
import { EquipmentComponentId } from "../../component/equipmentComponent.ts";
import { GroundItemComponentId } from "../../component/groundItemComponent.ts";
import { HeldItemComponentId } from "../../component/heldItemComponent.ts";
import { StockpileComponentId } from "../../component/stockpileComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import { findDropPosition } from "../dropItem.ts";

export type EquipPlannerCommand = {
    sourceEntityId: string;
    itemId: string;
    slot: "primary" | "secondary";
};

/**
 * Build the action plan for an equip player command. The plan handles two
 * possible displacements before fetching the new item:
 *
 *  1. If held holds a different item id than the source item, drop held
 *     to the ground first.
 *  2. If the target slot is already occupied, drop the slot item directly
 *     to the ground (using dropFromSlot, never passing through held).
 *
 * Returns an empty plan if the source entity is gone — caller treats this
 * as a failed command and clears it.
 */
export function planEquipCommand(
    root: Entity,
    entity: Entity,
    command: EquipPlannerCommand,
): BehaviorActionData[] {
    const equipment = entity.requireEcsComponent(EquipmentComponentId);
    const held = entity.requireEcsComponent(HeldItemComponentId);
    const source = root.findEntity(command.sourceEntityId);
    if (!source) {
        return [];
    }

    const sourceItem = inventoryItemsMap[command.itemId];
    if (!sourceItem) {
        throw new Error(`planEquipCommand: unknown itemId '${command.itemId}'`);
    }

    const actions: BehaviorActionData[] = [];

    // 1. Empty held if it holds something incompatible with the source.
    if (held.item && held.amount > 0 && held.item.id !== command.itemId) {
        const dropPos = findDropPosition(root, entity.worldPosition, held.item);
        if (!dropPos) {
            throw new Error(
                `planEquipCommand: cannot find drop position for held item ` +
                    `'${held.item.id}' within radius`,
            );
        }
        actions.push({ type: "moveTo", target: dropPos });
        actions.push({
            type: "dropHeld",
            destination: dropPos,
            reason: `Dropped ${held.item.name} to free hands for equipping ${sourceItem.name}`,
        });
    }

    // 2. Evict target slot if occupied — drop directly from slot, never
    //    pass through held (held may now contain the source item id).
    const slotItem = equipment.slots[command.slot];
    if (slotItem) {
        const evictDropPos = findDropPosition(
            root,
            entity.worldPosition,
            slotItem,
        );
        if (!evictDropPos) {
            throw new Error(
                `planEquipCommand: cannot find drop position for evicted ` +
                    `slot item '${slotItem.id}' within radius`,
            );
        }
        actions.push({ type: "moveTo", target: evictDropPos });
        actions.push({
            type: "dropFromSlot",
            slot: command.slot,
            destination: evictDropPos,
        });
    }

    // 3. Walk to source, pick up exactly one unit.
    actions.push({
        type: "moveTo",
        target: source.worldPosition,
        stopAdjacent: "cardinal",
    });

    if (source.getEcsComponent(StockpileComponentId)) {
        actions.push({
            type: "withdrawFromStockpile",
            stockpileId: source.id,
            itemId: command.itemId,
            amount: 1,
        });
    } else if (source.getEcsComponent(GroundItemComponentId)) {
        actions.push({
            type: "pickupFromGround",
            pileEntityId: source.id,
        });
    } else {
        throw new Error(
            `planEquipCommand: source ${command.sourceEntityId} is neither ` +
                `stockpile nor ground pile`,
        );
    }

    // 4. Equip.
    actions.push({ type: "equipFromHeld", slot: command.slot });
    actions.push({ type: "clearPlayerCommand" });
    return actions;
}
