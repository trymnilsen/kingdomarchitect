import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { getBuildingById } from "../../data/building/buildings.ts";
import { itemEffectFactoryList } from "../../data/inventory/itemEffectFactoryList.ts";
import {
    AttackCommandId,
    type AttackCommand,
} from "../../server/message/command/attackTargetCommand.ts";
import {
    BuildCommandId,
    type BuildCommand,
} from "../../server/message/command/buildCommand.ts";
import {
    ConsumeItemCommandId,
    type ConsumeItemCommand,
} from "../../server/message/command/consumeItemCommand.ts";
import {
    EquipItemCommandId,
    type EquipItemCommand,
} from "../../server/message/command/equipItemCommand.ts";
import {
    NewGameCommandId,
    type NewGameCommand,
} from "../../server/message/command/newGameCommand.ts";
import {
    QueueJobCommandId,
    type QueueJobCommand,
} from "../../server/message/command/queueJobCommand.ts";
import { notifyIdleWorkerForNewJob } from "./jobNotificationSystem.ts";
import {
    CommandGameMessageType,
    type GameMessage,
} from "../../server/message/gameMessage.ts";
import {
    ActiveEffectsComponentId,
    addEffect,
    createActiveEffectsComponent,
} from "../component/activeEffectsComponent.ts";
import {
    addCollectableItems,
    CollectableComponentId,
} from "../component/collectableComponent.ts";
import { EffectEmitterComponentId } from "../component/effectEmitterComponent.ts";
import { EquipmentComponentId } from "../component/equipmentComponent.ts";
import {
    addInventoryItem,
    InventoryComponentId,
    takeInventoryItem,
} from "../component/inventoryComponent.ts";
import {
    JobQueueComponentId,
    addJob,
} from "../component/jobQueueComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { AttackJob } from "../job/attackJob.ts";
import { BuildBuildingJob } from "../job/buildBuildingJob.ts";
import { buildingPrefab } from "../prefab/buildingPrefab.ts";
import type { GameTime } from "../gameTime.ts";
import type { PersistenceManager } from "../../server/persistence/persistenceManager.ts";
import { ReloadGameEffectId } from "../../server/message/effect/reloadGameEffect.ts";
import {
    ChangeOccupationCommandId,
    type ChangeOccupationCommand,
} from "../../server/message/command/changeOccupationCommand.ts";
import {
    SetPlayerCommandId,
    type SetPlayerCommand,
} from "../../server/message/command/setPlayerCommand.ts";
import { OccupationComponentId } from "../component/occupationComponent.ts";
import { WorkplaceComponentId } from "../component/workplaceComponent.ts";
import { removeItem } from "../../common/array.ts";
import { BehaviorAgentComponentId, requestReplan as requestBehaviorReplan } from "../behavior/components/BehaviorAgentComponent.ts";

export function createCommandSystem(
    gameTime: GameTime,
    persistenceManager: PersistenceManager,
): EcsSystem {
    return {
        onGameMessage: (root, message) =>
            onGameMessage(root, message, gameTime, persistenceManager),
    };
}

function onGameMessage(
    root: Entity,
    message: GameMessage,
    gameTime: GameTime,
    persistenceManager: PersistenceManager,
) {
    if (message.type != CommandGameMessageType) return;
    console.log("[CommandSystem] command: ", message.command);
    switch (message.command.id) {
        case NewGameCommandId:
            persistenceManager
                .clearGame()
                .then(() => {
                    root.requireEcsComponent(EffectEmitterComponentId).emitter({
                        id: ReloadGameEffectId,
                    });
                })
                .catch((err) => console.error(err));
            break;
        case ChangeOccupationCommandId:
            changeOccupation(root, message.command as ChangeOccupationCommand);
            break;
        case QueueJobCommandId:
            queueJob(root, message.command as QueueJobCommand, gameTime.tick);
            break;
        case EquipItemCommandId:
            equipItem(root, message.command as EquipItemCommand);
            break;
        case BuildCommandId:
            buildBuilding(root, message.command as BuildCommand);
            break;
        case AttackCommandId:
            attackTarget(root, message.command as AttackCommand);
            break;
        case ConsumeItemCommandId:
            consumeItem(root, message.command as ConsumeItemCommand);
            break;
        case SetPlayerCommandId:
            setPlayerCommand(root, message.command as SetPlayerCommand, gameTime);
            break;
    }
}

function changeOccupation(root: Entity, command: ChangeOccupationCommand) {
    const worker = root.findEntity(command.worker);
    if (!worker) {
        throw new Error(`Worker ${worker} not found`);
    }

    const workplace = root.findEntity(command.workplace);
    if (!workplace) {
        throw new Error(`workplace ${workplace} not found`);
    }

    const occupationComponent = worker.requireEcsComponent(
        OccupationComponentId,
    );

    const workplaceComponent =
        workplace.requireEcsComponent(WorkplaceComponentId);

    switch (command.action) {
        case "assign":
            occupationComponent.workplace = workplace.id;
            workplaceComponent.workers.push(worker.id);
            break;
        case "unassign":
            occupationComponent.workplace = undefined;
            removeItem(workplaceComponent.workers, worker.id);
            break;
    }

    worker.invalidateComponent(OccupationComponentId);
    workplace.invalidateComponent(WorkplaceComponentId);
}


function attackTarget(root: Entity, command: AttackCommand) {
    const job = AttackJob(command.attacker, command.target);
    root.updateComponent(JobQueueComponentId, (component) => {
        component.jobs.push(job);
    });
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

function queueJob(root: Entity, command: QueueJobCommand, tick: number) {
    const jobQueue = root.requireEcsComponent(JobQueueComponentId);
    addJob(jobQueue, command.job);

    root.invalidateComponent(JobQueueComponentId);

    // Immediately notify idle workers about the new job
    notifyIdleWorkerForNewJob(root, tick);
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

function setPlayerCommand(
    root: Entity,
    command: SetPlayerCommand,
    _gameTime: GameTime,
) {
    const agent = root.findEntity(command.agentId);
    if (!agent) {
        console.warn(`[SetPlayerCommand] Agent ${command.agentId} not found`);
        return;
    }

    const behaviorAgent = agent.getEcsComponent(BehaviorAgentComponentId);
    if (!behaviorAgent) {
        console.warn(
            `[SetPlayerCommand] Agent ${command.agentId} has no BehaviorAgent component`,
        );
        return;
    }

    // Set the player command on the agent
    behaviorAgent.playerCommand = command.command;
    agent.invalidateComponent(BehaviorAgentComponentId);

    // Trigger replan to execute command immediately
    requestBehaviorReplan(agent);

    console.log(
        `[SetPlayerCommand] Command set for agent ${command.agentId}: ${command.command.action}`,
    );
}
