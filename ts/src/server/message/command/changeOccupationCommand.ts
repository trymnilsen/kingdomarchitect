import type { Entity } from "../../../game/entity/entity.ts";

export type ChangeOccupationCommand = {
    id: typeof ChangeOccupationCommandId;
    /**
     * The entity id of the worker to change the occupation
     */
    worker: string;
    /**
     * The entity id of the workplace to assign occupation or unassign occupation from.
     */
    workplace: string;
    action: "assign" | "unassign";
};

/**
 *
 * @param target
 * @param attacker
 * @returns
 */
export function ChangeOccupationCommand(
    worker: Entity,
    workplace: Entity,
    action: ChangeOccupationCommand["action"],
): ChangeOccupationCommand {
    return {
        id: ChangeOccupationCommandId,
        worker: worker.id,
        workplace: workplace.id,
        action,
    };
}

export const ChangeOccupationCommandId = "changeOccupation";
