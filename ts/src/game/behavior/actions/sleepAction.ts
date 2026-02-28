import { EnergyComponentId } from "../../component/energyComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./Action.ts";
import { createLogger } from "../../../common/logging/logger.ts";

const log = createLogger("behavior");

/**
 * Sleep action - recovers energy over time.
 */
export function executeSleepAction(entity: Entity): ActionResult {
    const energy = entity.getEcsComponent(EnergyComponentId);

    if (!energy) {
        log.warn(
            `Entity ${entity.id} has no energy component`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    // Recover energy using the configured restore rate
    energy.energy = Math.min(100, energy.energy + energy.restoreRate);
    entity.invalidateComponent(EnergyComponentId);

    // Stop sleeping when energy is at or above 100
    if (energy.energy >= 100) {
        log.info(`Entity ${entity.id} is fully rested`);
        return ActionComplete;
    }

    return ActionRunning;
}
