import type { Entity } from "../../entity/entity.ts";
import { isImpassableStructure } from "../../component/traversalComponent.ts";
import { queryEntity } from "../../map/query/queryEntity.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import type { Behavior } from "./Behavior.ts";

/**
 * Utility above normal work (performJob = 50), hauling, player commands and combat
 * (both 90), so a worker left standing on a building always grounds itself before
 * doing anything else — including work it could otherwise perform from the rooftop
 * via adjacency. Deliberately below an urgent sleep/eat (which can climb past this):
 * sleeping inside one's own house is legitimate and should win; once that plan
 * finishes, this behaviour steps the worker back outside.
 */
const STEP_OUTSIDE_UTILITY = 92;

/**
 * Self-healing "get off the building" behaviour. `stepOnto` lets a worker stand on
 * an otherwise-impassable building to sleep, craft or operate it, but nothing
 * guaranteed they came back down afterwards: any follow-up action that only needs
 * to be adjacent to its target is satisfied from the building's own tile, so the
 * worker would keep working from the rooftop. A failed on-building action is worse,
 * clearing the queue and stranding them.
 *
 * Behaviour selection only runs at replan time (queue empty or action failed), so
 * this never interrupts active on-building work — it fires precisely once that work
 * has ended or been abandoned, expands to a single `stepOff`, and then (no longer
 * standing on a building) becomes invalid, so it self-terminates without looping.
 */
export function createStepOutsideBehavior(): Behavior {
    return {
        name: "stepOutside",

        isValid(entity: Entity): boolean {
            const root = entity.getRootEntity();
            const occupants = queryEntity(root, entity.worldPosition);
            return occupants.some((occupant) =>
                isImpassableStructure(occupant),
            );
        },

        utility(_entity: Entity): number {
            return STEP_OUTSIDE_UTILITY;
        },

        expand(_entity: Entity): BehaviorActionData[] {
            return [{ type: "stepOff" }];
        },
    };
}
