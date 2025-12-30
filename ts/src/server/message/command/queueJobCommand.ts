import type { Job, Jobs } from "../../../game/job/job.ts";
import type { GameCommand } from "../gameCommand.ts";

export type QueueJobCommand = {
    id: typeof QueueJobCommandId;
    job: Jobs;
};

export function QueueJobCommand(job: Jobs): QueueJobCommand {
    return {
        id: QueueJobCommandId,
        job,
    };
}

export const QueueJobCommandId = "queueJob";
