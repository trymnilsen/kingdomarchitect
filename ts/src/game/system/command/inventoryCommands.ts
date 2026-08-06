import { log } from "../../../common/logging/logger.ts";
import { itemEffectFactoryList } from "../../../data/inventory/itemEffectFactoryList.ts";
import type { ConsumeItemCommand } from "../../../server/message/command/consumeItemCommand.ts";
import {
    ActiveEffectsComponentId,
    addEffect,
    createActiveEffectsComponent,
} from "../../component/activeEffectsComponent.ts";
import { EquipmentComponentId } from "../../component/equipmentComponent.ts";
import {
    InventoryComponentId,
    takeInventoryItem,
} from "../../component/inventoryComponent.ts";
import type { Entity } from "../../entity/entity.ts";

/**
 * Uses up an equipped consumable and applies whatever effect it carries.
 *
 * The item has to exist in both places to be consumed. The equipment slot says
 * the entity has it ready to use, and the inventory holds the stack it is drawn
 * from. Taking from the stack happens before the slot is cleared so a failed
 * withdrawal leaves the item where it was.
 */
export function consumeItem(root: Entity, command: ConsumeItemCommand) {
    const entity = root.findEntity(command.entity);
    if (!entity) {
        log.error("Unable to consume, entity not found");
        return;
    }

    const equipment = entity.getEcsComponent(EquipmentComponentId);
    if (!equipment) {
        log.error("Unable to consume, equipment component not found");
        return;
    }

    const inventory = entity.getEcsComponent(InventoryComponentId);
    if (!inventory) {
        log.error("Unable to consume, inventory component not found");
        return;
    }

    const item = equipment.slots[command.slot];
    if (!item) {
        log.error("No item equipped in slot", { slot: command.slot });
        return;
    }

    const effectFactory = itemEffectFactoryList[item.id];
    if (!effectFactory) {
        log.error("No effect factory for item", { itemId: item.id });
        return;
    }

    const withdrawnItem = takeInventoryItem(inventory, item.id, 1);
    if (!withdrawnItem) {
        log.error("Not enough items in inventory");
        return;
    }

    equipment.slots[command.slot] = null;

    const effect = effectFactory(item);

    let activeEffects = entity.getEcsComponent(ActiveEffectsComponentId);
    if (!activeEffects) {
        activeEffects = createActiveEffectsComponent();
        entity.setEcsComponent(activeEffects);
    }

    addEffect(activeEffects, effect, entity.id);

    entity.invalidateComponent(InventoryComponentId);
    entity.invalidateComponent(EquipmentComponentId);
    entity.invalidateComponent(ActiveEffectsComponentId);
}
