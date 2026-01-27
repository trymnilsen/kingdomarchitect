import type { Entity } from "../../../game/entity/entity.ts";
import type { WorkerStance } from "../../../game/component/worker/roleComponent.ts";

export type UpdateWorkerStanceCommand = {
    id: typeof UpdateWorkerStanceCommandId;
    worker: string;
    stance: WorkerStance;
};

export function UpdateWorkerStanceCommand(
    worker: Entity,
    stance: WorkerStance,
): UpdateWorkerStanceCommand {
    return {
        id: UpdateWorkerStanceCommandId,
        worker: worker.id,
        stance,
    };
}

export const UpdateWorkerStanceCommandId = "updateWorkerStance";
