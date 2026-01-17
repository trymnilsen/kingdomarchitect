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
    CancelCraftingCommandId,
    type CancelCraftingCommand,
} from "../../server/message/command/cancelCraftingCommand.ts";
import {
    ConsumeItemCommandId,
    type ConsumeItemCommand,
} from "../../server/message/command/consumeItemCommand.ts";
import {
    LoadSpaceCommand,
    LoadSpaceCommandId,
} from "../../server/message/command/enterSpaceCommand.ts";
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
import {
    StartCraftingCommandId,
    type StartCraftingCommand,
} from "../../server/message/command/startCraftingCommand.ts";
import { SetSceneEffectId } from "../../server/message/effect/setSceneEffect.ts";
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
import { CraftingComponentId } from "../component/craftingComponent.ts";
import { EffectEmitterComponentId } from "../component/effectEmitterComponent.ts";
import { EquipmentComponentId } from "../component/equipmentComponent.ts";
import {
    addInventoryItem,
    InventoryComponentId,
    takeInventoryItem,
} from "../component/inventoryComponent.ts";
import { JobQueueComponentId } from "../component/jobQueueComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { AttackJob } from "../job/attackJob.ts";
import { BuildBuildingJob } from "../job/buildBuildingJob.ts";
import { overWorldId } from "../map/scenes.ts";
import { buildingPrefab } from "../prefab/buildingPrefab.ts";
import { interiorPrefab } from "../prefab/interiorPrefab.ts";
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
import { GoapAgentComponentId } from "../component/goapAgentComponent.ts";
import { requestReplan, ReplanUrgency } from "./goapReplanTrigger.ts";
import { removeItem } from "../../common/array.ts";

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
        case LoadSpaceCommandId:
            loadSpace(root, message.command as LoadSpaceCommand);
            break;
        case ChangeOccupationCommandId:
            changeOccupation(root, message.command as ChangeOccupationCommand);
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
        case StartCraftingCommandId:
            startCrafting(
                root,
                message.command as StartCraftingCommand,
                gameTime,
            );
            break;
        case CancelCraftingCommandId:
            cancelCrafting(root, message.command as CancelCraftingCommand);
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

function loadSpace(root: Entity, command: LoadSpaceCommand) {
    const spaceId = `interior_${command.entity}`;
    if (!root.children.some((child) => child.id === spaceId)) {
        const interior = interiorPrefab(spaceId);
        root.addChild(interior);
    }
    root.requireEcsComponent(EffectEmitterComponentId).emitter({
        id: SetSceneEffectId,
        entity: spaceId,
    });
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

function startCrafting(
    root: Entity,
    command: StartCraftingCommand,
    gameTime: GameTime,
) {
    const { entityId, recipeId } = command;
    const entity = root.findEntity(entityId);

    if (!entity) {
        console.warn(`[StartCrafting] Entity ${entityId} not found`);
        return;
    }

    const craftingComponent = entity.getEcsComponent(CraftingComponentId);

    if (!craftingComponent) {
        console.warn(
            `[StartCrafting] Entity ${entityId} has no CraftingComponent`,
        );
        return;
    }

    // Find the recipe
    const recipe = craftingComponent.recipes.find((r) => r.id === recipeId);
    if (!recipe) {
        console.warn(
            `[StartCrafting] Recipe ${recipeId} not found in building`,
        );
        return;
    }

    // Check if already crafting
    if (craftingComponent.activeCrafting) {
        console.warn(`[StartCrafting] Entity ${entityId} is already crafting`);
        return;
    }

    // Check inventory for required materials
    const inventory = entity.getEcsComponent(InventoryComponentId);
    if (!inventory) {
        console.warn(`[StartCrafting] Entity ${entityId} has no inventory`);
        return;
    }

    // Verify all inputs are available in the building's inventory
    for (const input of recipe.inputs) {
        const itemQuantity = inventory.items.find((i) => i.item === input.item);
        if (!itemQuantity || itemQuantity.amount < input.amount) {
            console.warn(
                `[StartCrafting] Not enough ${input.item.name} (need ${input.amount}, have ${itemQuantity?.amount ?? 0})`,
            );
            return;
        }
    }

    // Consume the materials from the building's inventory
    for (const input of recipe.inputs) {
        const itemIndex = inventory.items.findIndex(
            (i) => i.item === input.item,
        );
        if (itemIndex !== -1) {
            inventory.items[itemIndex].amount -= input.amount;
            if (inventory.items[itemIndex].amount <= 0) {
                inventory.items.splice(itemIndex, 1);
            }
        }
    }

    // Start crafting
    craftingComponent.activeCrafting = {
        recipe,
        startTick: gameTime.tick,
    };

    // Notify changes
    entity.invalidateComponent(InventoryComponentId);
    entity.invalidateComponent(CraftingComponentId);

    console.log(
        `[StartCrafting] Started crafting ${recipe.id} at entity ${entityId}`,
    );
}

function cancelCrafting(root: Entity, command: CancelCraftingCommand) {
    const { entityId } = command;
    const entity = root.findEntity(entityId);

    if (!entity) {
        console.warn(`[CancelCrafting] Entity ${entityId} not found`);
        return;
    }

    const craftingComponent = entity.getEcsComponent(CraftingComponentId);

    if (!craftingComponent) {
        console.warn(
            `[CancelCrafting] Entity ${entityId} has no CraftingComponent`,
        );
        return;
    }

    if (!craftingComponent.activeCrafting) {
        console.warn(`[CancelCrafting] Entity ${entityId} is not crafting`);
        return;
    }

    // Cancel the crafting - materials were already consumed and are lost
    // This is the cost of canceling
    craftingComponent.activeCrafting = null;
    entity.invalidateComponent(CraftingComponentId);

    console.log(
        `[CancelCrafting] Cancelled crafting at entity ${entityId} (materials lost)`,
    );
}

function setPlayerCommand(
    root: Entity,
    command: SetPlayerCommand,
    gameTime: GameTime,
) {
    const agent = root.findEntity(command.agentId);
    if (!agent) {
        console.warn(`[SetPlayerCommand] Agent ${command.agentId} not found`);
        return;
    }

    const goapAgent = agent.getEcsComponent(GoapAgentComponentId);
    if (!goapAgent) {
        console.warn(
            `[SetPlayerCommand] Agent ${command.agentId} has no GOAP agent component`,
        );
        return;
    }

    // Set the player command
    goapAgent.playerCommand = command.command;
    agent.invalidateComponent(GoapAgentComponentId);

    // Trigger urgent replan to execute command immediately
    requestReplan(
        goapAgent,
        ReplanUrgency.Critical,
        `player commanded: ${command.command.action}`,
        gameTime.tick,
    );

    console.log(
        `[SetPlayerCommand] Command set for agent ${command.agentId}: ${command.command.action}`,
    );
}
