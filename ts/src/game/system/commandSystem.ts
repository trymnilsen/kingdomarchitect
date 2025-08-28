import type { EcsSystem } from "../../common/ecs/ecsSystem.js";
import type { GameCommand } from "../../server/message/gameCommand.js";
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
    getInventoryItem,
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

export const commandSystem: EcsSystem = {
    onGameMessage,
};

function onGameMessage(root: Entity, message: GameMessage) {
    if (message.type != CommandGameMessageType) return;
    console.log("[CommandSystem] command: ", message.command);
    switch (message.command.id) {
        case QueueJobCommandId:
            queueJob(root, message.command as QueueJobCommand);
            break;
        case EquipItemCommandId:
            equipItem(root, message.command as EquipItemCommand);
            break;
        case BuildCommandId:
            buildBuilding(root, message.command as BuildCommand);
    }
}

function buildBuilding(root: Entity, command: BuildCommand) {
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
        root.addChild(buildingEntity);
        const job = BuildBuildingJob(buildingEntity);
        root.updateComponent(JobQueueComponentId, (component) => {
            component.jobs.push(job);
        });
    }
}

function queueJob(root: Entity, command: QueueJobCommand) {
    const jobQueue = root.requireEcsComponent(JobQueueComponentId);
    jobQueue.jobs.push(command.job);
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
