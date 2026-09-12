import type { Entity } from "../../../game/entity/entity.ts";
import type { WorkerRole } from "../../../game/component/worker/roleComponent.ts";

/**
 * Sets the whole role order rather than moving one role a step. A full
 * replacement cannot desync, however many are in flight or dropped.
 */
export type SetRolePriorityCommand = {
    id: typeof SetRolePriorityCommandId;
    worker: string;
    dutyPriority: WorkerRole[];
    permittedDutyCount: number;
};

export function SetRolePriorityCommand(
    worker: Entity,
    dutyPriority: readonly WorkerRole[],
    permittedDutyCount: number,
): SetRolePriorityCommand {
    return {
        id: SetRolePriorityCommandId,
        worker: worker.id,
        dutyPriority: [...dutyPriority],
        permittedDutyCount,
    };
}

export const SetRolePriorityCommandId = "setRolePriority";
