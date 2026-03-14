import {
    EnergyComponentId,
    clearEntityExhaustion,
} from "../../component/energyComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import {
    ActionComplete,
    ActionRunning,
    type ActionResult,
    type SleepQuality,
} from "./Action.ts";
import { getBehaviorAgent } from "../../component/BehaviorAgentComponent.ts";

export type SleepActionData = {
    type: "sleep";
    quality: SleepQuality;
    /** Energy restored per tick */
    energyPerTick: number;
    /** Energy value to reach before completing */
    energyTarget: number;
};

type SleepParams = {
    /** Energy restored per tick (at sleepMultiplier 1.0) */
    energyPerTick: number;
    /** Energy restored to (fraction of maxEnergy, 0-1) */
    energyRestoreFraction: number;
    /** Exhaustion level cleared to */
    clearsExhaustionTo: number;
    /** Whether the sleeper can be woken by danger (replan requests) */
    canBeWoken: boolean;
};

export const sleepParamsByQuality: Record<SleepQuality, SleepParams> = {
    house: {
        energyPerTick: 10,
        energyRestoreFraction: 1.0,
        clearsExhaustionTo: 0,
        canBeWoken: true,
    },
    bedrollFire: {
        energyPerTick: 8,
        energyRestoreFraction: 0.8,
        clearsExhaustionTo: 0,
        canBeWoken: true,
    },
    bedrollAlone: {
        energyPerTick: 6,
        energyRestoreFraction: 0.6,
        clearsExhaustionTo: 1,
        canBeWoken: true,
    },
    collapse: {
        energyPerTick: 2,
        energyRestoreFraction: 0.3,
        clearsExhaustionTo: 2,
        canBeWoken: false,
    },
};

/**
 * Execute one tick of the sleep action. Increments the entity's energy by
 * energyPerTick each tick and completes once energy reaches energyTarget.
 * Exhaustion is cleared on completion. Collapse-quality sleep suppresses
 * replanning until complete.
 */
export function executeSleepAction(
    action: SleepActionData,
    entity: Entity,
): ActionResult {
    const energy = entity.getEcsComponent(EnergyComponentId);
    if (energy) {
        energy.energy = Math.min(
            action.energyTarget,
            energy.energy + action.energyPerTick,
        );
        entity.invalidateComponent(EnergyComponentId);

        if (energy.energy >= action.energyTarget) {
            const params = sleepParamsByQuality[action.quality];
            clearEntityExhaustion(entity, params.clearsExhaustionTo);
            return ActionComplete;
        }
    }

    // Unconscious sleepers cannot be woken by danger
    if (!sleepParamsByQuality[action.quality].canBeWoken) {
        const agent = getBehaviorAgent(entity);
        if (agent && agent.pendingReplan) {
            agent.pendingReplan = undefined;
        }
    }

    return ActionRunning;
}
