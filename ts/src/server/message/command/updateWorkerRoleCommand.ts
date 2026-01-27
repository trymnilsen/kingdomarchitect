import type { Entity } from "../../../game/entity/entity.ts";
import type { WorkerRole } from "../../../game/component/worker/roleComponent.ts";

export type UpdateWorkerRoleCommand = {
    id: typeof UpdateWorkerRoleCommandId;
    worker: string;
    role: WorkerRole;
};

export function UpdateWorkerRoleCommand(
    worker: Entity,
    role: WorkerRole,
): UpdateWorkerRoleCommand {
    return {
        id: UpdateWorkerRoleCommandId,
        worker: worker.id,
        role,
    };
}

export const UpdateWorkerRoleCommandId = "updateWorkerRole";
