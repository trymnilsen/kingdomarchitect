import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { log } from "../../common/logging/logger.ts";
import { getBuildingById } from "../../data/building/buildings.ts";
import { itemEffectFactoryList } from "../../data/inventory/itemEffectFactoryList.ts";
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
    DropHeldCommandId,
    type DropHeldCommand,
} from "../../server/message/command/dropHeldCommand.ts";
import {
    UnequipItemCommandId,
    type UnequipItemCommand,
} from "../../server/message/command/unequipItemCommand.ts";
import {
    EquipFromHeldCommandId,
    type EquipFromHeldCommand,
} from "../../server/message/command/equipFromHeldCommand.ts";
import { HeldItemComponentId } from "../component/heldItemComponent.ts";
import { markStatsDirty } from "../component/statsComponent.ts";
import {
    NewGameCommandId,
    type NewGameCommand,
} from "../../server/message/command/newGameCommand.ts";
import {
    QueueJobCommandId,
    type QueueJobCommand,
} from "../../server/message/command/queueJobCommand.ts";
import {
    notifyIdleWorkerForNewJob,
    findPlayerKingdom,
} from "./jobNotificationSystem.ts";
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
import { MessageEmitterComponentId } from "../component/messageEmitterComponent.ts";
import { EquipmentComponentId } from "../component/equipmentComponent.ts";
import {
    addInventoryItem,
    InventoryComponentId,
    takeInventoryItem,
} from "../component/inventoryComponent.ts";
import { JobQueueComponentId, addJob } from "../component/jobQueueComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { BuildBuildingJob } from "../job/buildBuildingJob.ts";
import { buildingPrefab } from "../prefab/buildingPrefab.ts";
import type { GameTime } from "../gameTime.ts";
import type { PersistenceManager } from "../../server/persistence/persistenceManager.ts";
import { ReloadGameMessageType } from "../../server/message/gameMessage.ts";
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
import {
    BehaviorAgentComponentId,
    requestReplan as requestBehaviorReplan,
} from "../component/BehaviorAgentComponent.ts";
import {
    UpdateWorkerRoleCommandId,
    type UpdateWorkerRoleCommand,
} from "../../server/message/command/updateWorkerRoleCommand.ts";
import {
    UpdateWorkerStanceCommandId,
    type UpdateWorkerStanceCommand,
} from "../../server/message/command/updateWorkerStanceCommand.ts";
import { RoleComponentId } from "../component/worker/roleComponent.ts";
import {
    SetPreferredAmountCommandId,
    type SetPreferredAmountCommand,
} from "../../server/message/command/setPreferredAmountCommand.ts";
import {
    setPreferredAmount,
    StockpileComponentId,
} from "../component/stockpileComponent.ts";
import {
    ClearBuildingJobsCommandId,
    type ClearBuildingJobsCommand,
} from "../../server/message/command/clearBuildingJobsCommand.ts";
import { isTargetOfJob } from "../job/job.ts";

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
    log.info("command", { command: message.command });
    switch (message.command.id) {
        case NewGameCommandId:
            persistenceManager
                .clearGame()
                .then(() => {
                    root.requireEcsComponent(MessageEmitterComponentId).emitter(
                        {
                            type: ReloadGameMessageType,
                        },
                    );
                })
                .catch((err) => log.error("Failed to clear game", { err }));
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
        case DropHeldCommandId:
            dropHeld(root, message.command as DropHeldCommand);
            break;
        case UnequipItemCommandId:
            unequipItem(root, message.command as UnequipItemCommand);
            break;
        case EquipFromHeldCommandId:
            equipFromHeld(root, message.command as EquipFromHeldCommand);
            break;
        case BuildCommandId:
            buildBuilding(root, message.command as BuildCommand);
            break;
        case ConsumeItemCommandId:
            consumeItem(root, message.command as ConsumeItemCommand);
            break;
        case SetPlayerCommandId:
            setPlayerCommand(
                root,
                message.command as SetPlayerCommand,
                gameTime,
            );
            break;
        case UpdateWorkerRoleCommandId:
            updateWorkerRole(root, message.command as UpdateWorkerRoleCommand);
            break;
        case UpdateWorkerStanceCommandId:
            updateWorkerStance(
                root,
                message.command as UpdateWorkerStanceCommand,
            );
            break;
        case SetPreferredAmountCommandId:
            handleSetPreferredAmount(
                root,
                message.command as SetPreferredAmountCommand,
            );
            break;
        case ClearBuildingJobsCommandId:
            clearBuildingJobs(
                root,
                message.command as ClearBuildingJobsCommand,
            );
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

function buildBuilding(root: Entity, command: BuildCommand) {
    const points = Array.isArray(command.position)
        ? command.position
        : [command.position];
    const building = getBuildingById(command.buildingId);
    if (!building) {
        log.error("Building not found", { buildingId: command.buildingId });
        return;
    }

    const playerKingdom = findPlayerKingdom(root);
    if (!playerKingdom) {
        log.error("Player kingdom not found, cannot place building");
        return;
    }

    for (const point of points) {
        const buildingEntity = buildingPrefab(building, true);
        playerKingdom.addChild(buildingEntity);
        buildingEntity.worldPosition = point;
        const job = BuildBuildingJob(buildingEntity);
        playerKingdom.updateComponent(JobQueueComponentId, (component) => {
            component.jobs.push(job);
        });
    }
}

function queueJob(root: Entity, command: QueueJobCommand, tick: number) {
    const playerKingdom = findPlayerKingdom(root);
    if (!playerKingdom) {
        log.error("Player kingdom not found for job queue");
        return;
    }
    const jobQueue = playerKingdom.requireEcsComponent(JobQueueComponentId);
    addJob(jobQueue, command.job);

    playerKingdom.invalidateComponent(JobQueueComponentId);

    // Immediately notify idle workers about the new job
    notifyIdleWorkerForNewJob(playerKingdom, tick);
}

function equipItem(root: Entity, command: EquipItemCommand) {
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

function unequipItem(root: Entity, command: UnequipItemCommand) {
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

function equipFromHeld(root: Entity, command: EquipFromHeldCommand) {
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

function dropHeld(root: Entity, command: DropHeldCommand) {
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

function consumeItem(root: Entity, command: ConsumeItemCommand) {
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

    // Get the item from the specified slot
    const item = equipment.slots[command.slot];
    if (!item) {
        log.error("No item equipped in slot", { slot: command.slot });
        return;
    }

    // Check if we have an effect factory for this item
    const effectFactory = itemEffectFactoryList[item.id];
    if (!effectFactory) {
        log.error("No effect factory for item", { itemId: item.id });
        return;
    }

    // Try to take the item from inventory (for stack management)
    const withdrawnItem = takeInventoryItem(inventory, item.id, 1);
    if (!withdrawnItem) {
        log.error("Not enough items in inventory");
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
    addEffect(activeEffects, effect, entity.id);

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
        log.warn("Agent not found for SetPlayerCommand", {
            agentId: command.agentId,
        });
        return;
    }

    const behaviorAgent = agent.getEcsComponent(BehaviorAgentComponentId);
    if (!behaviorAgent) {
        log.warn("Agent has no BehaviorAgent component", {
            agentId: command.agentId,
        });
        return;
    }

    // Set the player command on the agent
    behaviorAgent.playerCommand = command.command;
    agent.invalidateComponent(BehaviorAgentComponentId);

    // Trigger replan to execute command immediately
    requestBehaviorReplan(agent);

    log.info("Command set for agent", {
        agentId: command.agentId,
        action: command.command.action,
    });
}

function updateWorkerRole(root: Entity, command: UpdateWorkerRoleCommand) {
    const worker = root.findEntity(command.worker);
    if (!worker) {
        log.warn("Worker not found for UpdateWorkerRole", {
            worker: command.worker,
        });
        return;
    }

    const roleComponent = worker.getEcsComponent(RoleComponentId);
    if (!roleComponent) {
        log.warn("Worker has no role component", { worker: command.worker });
        return;
    }

    roleComponent.role = command.role;
    worker.invalidateComponent(RoleComponentId);
}

function updateWorkerStance(root: Entity, command: UpdateWorkerStanceCommand) {
    const worker = root.findEntity(command.worker);
    if (!worker) {
        log.warn("Worker not found for UpdateWorkerStance", {
            worker: command.worker,
        });
        return;
    }

    const roleComponent = worker.getEcsComponent(RoleComponentId);
    if (!roleComponent) {
        log.warn("Worker has no role component for UpdateWorkerStance", {
            worker: command.worker,
        });
        return;
    }

    roleComponent.stance = command.stance;
    worker.invalidateComponent(RoleComponentId);
}

function handleSetPreferredAmount(
    root: Entity,
    command: SetPreferredAmountCommand,
) {
    const stockpile = root.findEntity(command.stockpileEntityId);
    if (!stockpile) {
        log.warn("Stockpile not found for SetPreferredAmount", {
            entityId: command.stockpileEntityId,
        });
        return;
    }

    const stockpileComponent = stockpile.getEcsComponent(StockpileComponentId);
    if (!stockpileComponent) {
        log.warn("Entity is not a stockpile", {
            entityId: command.stockpileEntityId,
        });
        return;
    }

    setPreferredAmount(stockpileComponent, command.itemId, command.amount);
    stockpile.invalidateComponent(StockpileComponentId);
}

function clearBuildingJobs(root: Entity, command: ClearBuildingJobsCommand) {
    const playerKingdom = findPlayerKingdom(root);
    if (!playerKingdom) {
        log.warn("Player kingdom not found for ClearBuildingJobs");
        return;
    }

    const building = root.findEntity(command.buildingId);
    if (!building) {
        log.warn("Building not found for ClearBuildingJobs", {
            buildingId: command.buildingId,
        });
        return;
    }

    const jobQueue = playerKingdom.requireEcsComponent(JobQueueComponentId);
    jobQueue.jobs = jobQueue.jobs.filter(
        (job) =>
            !(
                job.id === command.jobTypeId &&
                job.claimedBy === undefined &&
                isTargetOfJob(job, building)
            ),
    );
    playerKingdom.invalidateComponent(JobQueueComponentId);
}
