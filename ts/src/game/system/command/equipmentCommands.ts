import { log } from "../../../common/logging/logger.ts";
import type { DropHeldCommand } from "../../../server/message/command/dropHeldCommand.ts";
import type { EquipFromHeldCommand } from "../../../server/message/command/equipFromHeldCommand.ts";
import type { EquipItemCommand } from "../../../server/message/command/equipItemCommand.ts";
import type { UnequipItemCommand } from "../../../server/message/command/unequipItemCommand.ts";
import {
    BehaviorAgentComponentId,
    requestReplan as requestBehaviorReplan,
} from "../../component/BehaviorAgentComponent.ts";
import { EquipmentComponentId } from "../../component/equipmentComponent.ts";
import { HeldItemComponentId } from "../../component/heldItemComponent.ts";
import { markStatsDirty } from "../../component/statsComponent.ts";
import type { Entity } from "../../entity/entity.ts";

/**
 * Handlers for the commands that move items between a worker's hands and its
 * equipment slots.
 *
 * Equipping and dropping go through the behavior agent rather than mutating
 * slots outright, because the worker may need to walk somewhere first. Taking
 * something off is immediate, since that needs no travel.
 */
export function equipItem(root: Entity, command: EquipItemCommand) {
    const entity = root.findEntity(command.entity);
    if (!entity) {
        log.error("Unable to equip, entity not found");
        return;
    }

    const equipment = entity.getEcsComponent(EquipmentComponentId);
    if (!equipment) {
        log.error("Unable to equip, equipment component not found");
        return;
    }

    if (!(command.slot in equipment.slots)) {
        log.error("No equipment slot on entity", {
            slot: command.slot,
            entityId: entity.id,
        });
        return;
    }

    const agent = entity.getEcsComponent(BehaviorAgentComponentId);
    if (!agent) {
        log.warn("Equip: entity has no behavior agent", {
            entity: command.entity,
        });
        return;
    }

    agent.playerCommand = {
        action: "equip",
        sourceEntityId: command.sourceEntityId,
        itemId: command.itemId,
        slot: command.slot,
    };
    entity.invalidateComponent(BehaviorAgentComponentId);
    requestBehaviorReplan(entity);
}

export function unequipItem(root: Entity, command: UnequipItemCommand) {
    const entity = root.findEntity(command.entity);
    if (!entity) {
        log.error("Unable to unequip, entity not found");
        return;
    }

    const equipment = entity.getEcsComponent(EquipmentComponentId);
    const held = entity.getEcsComponent(HeldItemComponentId);
    if (!equipment || !held) {
        log.error("Unable to unequip, missing equipment or held component");
        return;
    }

    const slotItem = equipment.slots[command.slot];
    if (!slotItem) {
        return;
    }

    if (held.item !== null && held.amount > 0) {
        log.warn("Unequip failed: held is occupied", {
            entity: command.entity,
            slot: command.slot,
        });
        return;
    }

    held.item = slotItem;
    held.amount = 1;
    equipment.slots[command.slot] = null;

    entity.invalidateComponent(HeldItemComponentId);
    entity.invalidateComponent(EquipmentComponentId);
    markStatsDirty(entity);
}

export function equipFromHeld(root: Entity, command: EquipFromHeldCommand) {
    const entity = root.findEntity(command.entity);
    if (!entity) {
        log.error("Unable to equipFromHeld, entity not found");
        return;
    }
    const equipment = entity.getEcsComponent(EquipmentComponentId);
    if (!equipment) return;
    if (!(command.slot in equipment.slots)) return;

    const agent = entity.getEcsComponent(BehaviorAgentComponentId);
    if (!agent) return;

    agent.playerCommand = {
        action: "equipFromHeld",
        slot: command.slot,
    };
    entity.invalidateComponent(BehaviorAgentComponentId);
    requestBehaviorReplan(entity);
}

export function dropHeld(root: Entity, command: DropHeldCommand) {
    const entity = root.findEntity(command.entity);
    if (!entity) {
        log.warn("DropHeld: entity not found", { entity: command.entity });
        return;
    }

    const agent = entity.getEcsComponent(BehaviorAgentComponentId);
    if (!agent) {
        log.warn("DropHeld: entity has no behavior agent", {
            entity: command.entity,
        });
        return;
    }

    agent.playerCommand = { action: "drop" };
    entity.invalidateComponent(BehaviorAgentComponentId);
    requestBehaviorReplan(entity);
}
