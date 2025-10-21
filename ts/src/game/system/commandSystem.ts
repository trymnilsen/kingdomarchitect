import type { EcsSystem } from "../../common/ecs/ecsSystem.js";
import {
    CommandGameMessageType,
    type GameMessage,
} from "../../server/message/gameMessage.js";
import {
    QueueJobCommandId,
    type QueueJobCommand,
} from "../../server/message/command/queueJobCommand.js";
import { JobQueueComponentId } from "../component/jobQueueComponent.js";
import type { Entity } from "../entity/entity.js";
import {
    EquipItemCommandId,
    type EquipItemCommand,
} from "../../server/message/command/equipItemCommand.js";
import {
    addInventoryItem,
    InventoryComponentId,
    takeInventoryItem,
} from "../component/inventoryComponent.js";
import { EquipmentComponentId } from "../component/equipmentComponent.js";
import {
    BuildCommandId,
    type BuildCommand,
} from "../../server/message/command/buildCommand.js";
import { buildingPrefab } from "../prefab/buildingPrefab.js";
import { getBuildingById } from "../../data/building/buildings.js";
import { BuildBuildingJob } from "../job/buildBuildingJob.js";
import {
    AttackCommandId,
    type AttackCommand,
} from "../../server/message/command/attackTargetCommand.js";
import { AttackJob } from "../job/attackJob.js";
import {
    ConsumeItemCommandId,
    type ConsumeItemCommand,
} from "../../server/message/command/consumeItemCommand.js";
import {
    ActiveEffectsComponentId,
    addEffect,
    createActiveEffectsComponent,
} from "../component/activeEffectsComponent.js";
import { itemEffectFactoryList } from "../../data/inventory/itemEffectFactoryList.js";
import { inventoryItemsMap } from "../../data/inventory/inventoryItems.js";
import {
    LoadSpaceCommand,
    LoadSpaceCommandId,
} from "../../server/message/command/enterSpaceCommand.js";
import { interiorPrefab } from "../prefab/interiorPrefab.js";
import { overWorldId } from "../map/scenes.js";

export const commandSystem: EcsSystem = {
    onGameMessage,
};

function onGameMessage(root: Entity, message: GameMessage) {
    if (message.type != CommandGameMessageType) return;
    console.log("[CommandSystem] command: ", message.command);
    switch (message.command.id) {
        case LoadSpaceCommandId:
            loadSpace(root, message.command as LoadSpaceCommand);
            break;
        case QueueJobCommandId:
            queueJob(root, message.command as QueueJobCommand);
            break;
        case EquipItemCommandId:
            equipItem(root, message.command as EquipItemCommand);
            break;
        case BuildCommandId:
            const overWorld = root.children.find(
                (child) => child.id == overWorldId,
            );
            if (!overWorld) throw new Error("No overworld found, cannot build");
            buildBuilding(overWorld, message.command as BuildCommand);
            break;
        case AttackCommandId:
            attackTarget(root, message.command as AttackCommand);
            break;
        case ConsumeItemCommandId:
            consumeItem(root, message.command as ConsumeItemCommand);
            break;
    }
}

function loadSpace(root: Entity, command: LoadSpaceCommand) {
    const spaceId = `interior_${command.entity}`;
    if (!root.children.some((child) => child.id === spaceId)) {
        const interior = interiorPrefab(spaceId);
        root.addChild(interior);
    }
}

function attackTarget(root: Entity, command: AttackCommand) {
    const job = AttackJob(command.attacker, command.target);
    root.updateComponent(JobQueueComponentId, (component) => {
        component.jobs.push(job);
    });
}

function buildBuilding(overworld: Entity, command: BuildCommand) {
    //Check if we have enough to build
    //Add entities for each
    const points = Array.isArray(command.position)
        ? command.position
        : [command.position];
    const building = getBuildingById(command.buildingId);
    if (!building) {
        console.error(`Building not found ${command.buildingId}`);
        return;
    }

    for (const point of points) {
        const buildingEntity = buildingPrefab(building, true);
        buildingEntity.worldPosition = point;
        overworld.addChild(buildingEntity);
        const job = BuildBuildingJob(buildingEntity);
        overworld
            .getRootEntity()
            .updateComponent(JobQueueComponentId, (component) => {
                component.jobs.push(job);
            });
    }
}

function queueJob(root: Entity, command: QueueJobCommand) {
    const jobQueue = root.requireEcsComponent(JobQueueComponentId);
    jobQueue.jobs.push(command.job);
    root.invalidateComponent(JobQueueComponentId);
}

function equipItem(root: Entity, command: EquipItemCommand) {
    const entity = root.findEntity(command.entity);
    if (!entity) {
        console.error("Unable to equip, entity not found");
        return;
    }

    const inventory = entity.getEcsComponent(InventoryComponentId);
    const equipment = entity.getEcsComponent(EquipmentComponentId);
    if (!inventory) {
        console.error("Unable to equip, inventory component not found");
        return;
    }
    if (!equipment) {
        console.error("Unable to equip, equipment component not found");
        return;
    }

    const slotExists = command.slot in equipment.slots;
    if (!slotExists) {
        console.error(`No equipment slot for ${command.slot} on ${entity.id}`);
        return;
    }
    // An item id can either be defined meaning equip or null meaning unequip
    const itemId = command.itemId;
    if (itemId) {
        const withdrawnItem = takeInventoryItem(inventory, itemId, 1);
        if (!withdrawnItem) {
            console.error("Not enough items to take item from inventory");
            return;
        }

        equipment.slots[command.slot] = withdrawnItem.item;
    } else {
        const itemAtSlot = equipment.slots[command.slot];
        if (!itemAtSlot) {
            //Cannot unequit an item in a slot with no item
            return;
        }

        addInventoryItem(inventory, itemAtSlot, 1);
        equipment.slots[command.slot] = null;
    }
    entity.invalidateComponent(InventoryComponentId);
    entity.invalidateComponent(EquipmentComponentId);
}

function consumeItem(root: Entity, command: ConsumeItemCommand) {
    const entity = root.findEntity(command.entity);
    if (!entity) {
        console.error("Unable to consume, entity not found");
        return;
    }

    const equipment = entity.getEcsComponent(EquipmentComponentId);
    if (!equipment) {
        console.error("Unable to consume, equipment component not found");
        return;
    }

    const inventory = entity.getEcsComponent(InventoryComponentId);
    if (!inventory) {
        console.error("Unable to consume, inventory component not found");
        return;
    }

    // Get the item from the specified slot
    const item = equipment.slots[command.slot];
    if (!item) {
        console.error(`No item equipped in slot: ${command.slot}`);
        return;
    }

    // Check if we have an effect factory for this item
    const effectFactory = itemEffectFactoryList[item.id];
    if (!effectFactory) {
        console.error(`No effect factory for item: ${item.id}`);
        return;
    }

    // Try to take the item from inventory (for stack management)
    const withdrawnItem = takeInventoryItem(inventory, item.id, 1);
    if (!withdrawnItem) {
        console.error("Not enough items in inventory");
        return;
    }

    // Remove the item from the equipment slot
    equipment.slots[command.slot] = null;

    // Create the effect from the item
    const effect = effectFactory(item);

    // Get or create the active effects component
    let activeEffects = entity.getEcsComponent(ActiveEffectsComponentId);
    if (!activeEffects) {
        activeEffects = createActiveEffectsComponent();
        entity.setEcsComponent(activeEffects);
    }

    // Add the effect to the entity
    addEffect(activeEffects, effect);

    // Notify changes
    entity.invalidateComponent(InventoryComponentId);
    entity.invalidateComponent(EquipmentComponentId);
    entity.invalidateComponent(ActiveEffectsComponentId);
}
