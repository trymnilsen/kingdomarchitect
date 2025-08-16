import type { EcsSystem } from "../../common/ecs/ecsSystem.js";
import type { GameCommand } from "../../server/message/gameCommand.js";
import {
    CommandGameMessageType,
    type GameMessage,
} from "../../server/message/gameMessage.js";
import {
    QueueJobCommandId,
    type QueueJobCommand,
} from "../../server/message/queueJobCommand.js";
import { JobQueueComponentId } from "../component/jobQueueComponent.js";
import type { Entity } from "../entity/entity.js";

export const commandSystem: EcsSystem = {
    onGameMessage,
};

function onGameMessage(root: Entity, message: GameMessage) {
    if (message.type != CommandGameMessageType) return;

    if (message.command.id == QueueJobCommandId) {
        queueJob(root, message.command);
    }
}

function queueJob(root: Entity, command: GameCommand) {
    console.log("[CommandSystem] queue job", command);
    const jobQueue = root.requireEcsComponent(JobQueueComponentId);
    jobQueue.jobs.push((command as QueueJobCommand).job);
}
