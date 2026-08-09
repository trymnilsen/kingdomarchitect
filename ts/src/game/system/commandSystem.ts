import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import { log } from "../../common/logging/logger.ts";
import type { GameTime } from "../gameTime.ts";
import {
    BuildCommandId,
    type BuildCommand,
} from "../../server/message/command/buildCommand.ts";
import {
    ChangeOccupationCommandId,
    type ChangeOccupationCommand,
} from "../../server/message/command/changeOccupationCommand.ts";
import {
    ClearBuildingJobsCommandId,
    type ClearBuildingJobsCommand,
} from "../../server/message/command/clearBuildingJobsCommand.ts";
import {
    ConsumeItemCommandId,
    type ConsumeItemCommand,
} from "../../server/message/command/consumeItemCommand.ts";
import {
    DismantleBuildingCommandId,
    type DismantleBuildingCommand,
} from "../../server/message/command/dismantleBuildingCommand.ts";
import {
    DropHeldCommandId,
    type DropHeldCommand,
} from "../../server/message/command/dropHeldCommand.ts";
import {
    EquipFromHeldCommandId,
    type EquipFromHeldCommand,
} from "../../server/message/command/equipFromHeldCommand.ts";
import {
    EquipItemCommandId,
    type EquipItemCommand,
} from "../../server/message/command/equipItemCommand.ts";
import { NewGameCommandId } from "../../server/message/command/newGameCommand.ts";
import {
    PrioritiseJobCommandId,
    type PrioritiseJobCommand,
} from "../../server/message/command/prioritiseJobCommand.ts";
import {
    QueueJobCommandId,
    type QueueJobCommand,
} from "../../server/message/command/queueJobCommand.ts";
import {
    SetFarmCropCommandId,
    type SetFarmCropCommand,
} from "../../server/message/command/setFarmCropCommand.ts";
import {
    SetPlayerCommandId,
    type SetPlayerCommand,
} from "../../server/message/command/setPlayerCommand.ts";
import {
    SetPreferredAmountCommandId,
    type SetPreferredAmountCommand,
} from "../../server/message/command/setPreferredAmountCommand.ts";
import {
    SetSearchlightModeCommandId,
    type SetSearchlightModeCommand,
} from "../../server/message/command/setSearchlightModeCommand.ts";
import {
    SetStationPriorityCommandId,
    type SetStationPriorityCommand,
} from "../../server/message/command/setStationPriorityCommand.ts";
import {
    UnequipItemCommandId,
    type UnequipItemCommand,
} from "../../server/message/command/unequipItemCommand.ts";
import {
    UpdateWorkerRoleCommandId,
    type UpdateWorkerRoleCommand,
} from "../../server/message/command/updateWorkerRoleCommand.ts";
import {
    UpdateWorkerStanceCommandId,
    type UpdateWorkerStanceCommand,
} from "../../server/message/command/updateWorkerStanceCommand.ts";
import {
    CommandGameMessageType,
    ReloadGameMessageType,
    type GameMessage,
} from "../../server/message/gameMessage.ts";
import type { PersistenceManager } from "../../server/persistence/persistenceManager.ts";
import { MessageEmitterComponentId } from "../component/messageEmitterComponent.ts";
import type { Entity } from "../entity/entity.ts";
import {
    buildBuilding,
    clearBuildingJobs,
    dismantleBuilding,
} from "./command/buildingCommands.ts";
import {
    dropHeld,
    equipFromHeld,
    equipItem,
    unequipItem,
} from "./command/equipmentCommands.ts";
import { setFarmCrop } from "./command/farmCommands.ts";
import { consumeItem } from "./command/inventoryCommands.ts";
import { prioritiseJob, queueJob } from "./command/jobCommands.ts";
import { setPlayerCommand } from "./command/playerCommands.ts";
import {
    setSearchlightMode,
    setStationPriority,
} from "./command/stationCommands.ts";
import { setStockpilePreferredAmount } from "./command/stockpileCommands.ts";
import {
    changeOccupation,
    updateWorkerRole,
    updateWorkerStance,
} from "./command/workerCommands.ts";

/**
 * Routes player commands arriving from the client to the handler that carries
 * them out.
 *
 * This module only dispatches. The handlers live one per domain under
 * `./command/`, matching how `server/message/command/` splits the command
 * types themselves. A new command means a new case here and a function there.
 */
export function createCommandSystem(
    persistenceManager: PersistenceManager,
    gameTime: GameTime,
): EcsSystem {
    return {
        onGameMessage: (root, message) =>
            onGameMessage(root, message, persistenceManager, gameTime.tick),
    };
}

function onGameMessage(
    root: Entity,
    message: GameMessage,
    persistenceManager: PersistenceManager,
    tick: number,
) {
    if (message.type != CommandGameMessageType) return;
    log.info("command", { command: message.command });
    switch (message.command.id) {
        case NewGameCommandId:
            // Kept inline because it is the one command that needs the
            // persistence manager and completes asynchronously.
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
            queueJob(root, message.command as QueueJobCommand);
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
            setPlayerCommand(root, message.command as SetPlayerCommand);
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
        case SetFarmCropCommandId:
            setFarmCrop(root, message.command as SetFarmCropCommand);
            break;
        case SetPreferredAmountCommandId:
            setStockpilePreferredAmount(
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
        case DismantleBuildingCommandId:
            dismantleBuilding(
                root,
                tick,
                message.command as DismantleBuildingCommand,
            );
            break;
        case PrioritiseJobCommandId:
            prioritiseJob(root, message.command as PrioritiseJobCommand);
            break;
        case SetStationPriorityCommandId:
            setStationPriority(
                root,
                message.command as SetStationPriorityCommand,
            );
            break;
        case SetSearchlightModeCommandId:
            setSearchlightMode(
                root,
                message.command as SetSearchlightModeCommand,
            );
            break;
    }
}
