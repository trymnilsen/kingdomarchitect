import type { EcsSystem } from "../../common/ecs/ecsSystem.js";
import type { GameCommand } from "../../server/message/gameCommand.js";
import {
    QueueJobCommandId,
    type QueueJobCommand,
} from "../../server/message/queueJobCommand.js";
import { JobQueueComponentId } from "../component/jobQueueComponent.js";
import type { Entity } from "../entity/entity.js";

export const commandSystem: EcsSystem = {
    onCommand: {
        [QueueJobCommandId]: queueJob,
    },
};

function queueJob(root: Entity, command: GameCommand) {
    console.log("[CommandSystem] queue job", command);
    const jobQueue = root.requireEcsComponent(JobQueueComponentId);
    jobQueue.jobs.push((command as QueueJobCommand).job);
}
