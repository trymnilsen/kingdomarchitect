import { EnergyComponentId } from "../../component/energyComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import type { ActionStatus } from "./Action.ts";

/**
 * Sleep action - recovers energy over time.
 */
export function executeSleepAction(entity: Entity): ActionStatus {
    const energy = entity.getEcsComponent(EnergyComponentId);

    if (!energy) {
        console.warn(
            `[SleepAction] Entity ${entity.id} has no energy component`,
        );
        return "failed";
    }

    // Recover energy using the configured restore rate
    energy.energy = Math.min(100, energy.energy + energy.restoreRate);
    entity.invalidateComponent(EnergyComponentId);

    // Stop sleeping when energy is at or above 100
    if (energy.energy >= 100) {
        console.log(`[SleepAction] Entity ${entity.id} is fully rested`);
        return "complete";
    }

    return "running";
}
