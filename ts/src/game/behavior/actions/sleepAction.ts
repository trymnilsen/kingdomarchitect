import {
    EnergyComponentId,
    clearEntityExhaustion,
} from "../../component/energyComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import {
    ActionComplete,
    ActionRunning,
    type ActionResult,
    type BehaviorActionData,
    type SleepQuality,
} from "./Action.ts";
import { getBehaviorAgent } from "../../component/BehaviorAgentComponent.ts";

type SleepParams = {
    /** Base duration in ticks before species multiplier */
    baseDuration: number;
    /** Energy restored to (fraction of maxEnergy, 0-1) */
    energyRestoreFraction: number;
    /** Exhaustion level cleared to */
    clearsExhaustionTo: number;
    /** Whether the sleeper can be woken by danger (replan requests) */
    canBeWoken: boolean;
};

export const sleepParamsByQuality: Record<SleepQuality, SleepParams> = {
    house: {
        baseDuration: 40,
        energyRestoreFraction: 1.0,
        clearsExhaustionTo: 0,
        canBeWoken: true,
    },
    bedrollFire: {
        baseDuration: 55,
        energyRestoreFraction: 0.8,
        clearsExhaustionTo: 0,
        canBeWoken: true,
    },
    bedrollAlone: {
        baseDuration: 70,
        energyRestoreFraction: 0.6,
        clearsExhaustionTo: 1,
        canBeWoken: true,
    },
    collapse: {
        baseDuration: 100,
        energyRestoreFraction: 0.3,
        clearsExhaustionTo: 2,
        canBeWoken: false,
    },
};

/**
 * Calculate total sleep duration for a given quality and entity.
 * Applies the entity's sleepMultiplier to the base duration.
 */
export function computeSleepDuration(
    quality: SleepQuality,
    entity: Entity,
): number {
    const energy = entity.getEcsComponent(EnergyComponentId);
    const multiplier = energy?.sleepMultiplier ?? 1.0;
    return Math.ceil(sleepParamsByQuality[quality].baseDuration * multiplier);
}

/**
 * Execute one tick of the sleep action. Increments ticksSlept and completes
 * when enough ticks have elapsed, restoring energy and clearing exhaustion.
 * Collapse-quality sleep suppresses replanning until complete.
 */
export function executeSleepAction(
    action: Extract<BehaviorActionData, { type: "sleep" }>,
    entity: Entity,
): ActionResult {
    action.ticksSlept++;

    if (action.ticksSlept >= action.duration) {
        const energy = entity.getEcsComponent(EnergyComponentId);
        if (energy) {
            const params = sleepParamsByQuality[action.quality];
            energy.energy = Math.floor(
                energy.maxEnergy * params.energyRestoreFraction,
            );
            entity.invalidateComponent(EnergyComponentId);
            clearEntityExhaustion(entity, params.clearsExhaustionTo);
        }
        return ActionComplete;
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
