import {
    EnergyComponentId,
    clearEntityExhaustion,
} from "../../component/energyComponent.ts";
import { heal, HealthComponentId } from "../../component/healthComponent.ts";
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
    /** Fractional HP carried between ticks (mutable progress field) */
    healAccumulator?: number;
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
    /** HP restored per tick while sleeping */
    healPerTick: number;
};

export const sleepParamsByQuality: Record<SleepQuality, SleepParams> = {
    house: {
        energyPerTick: 10,
        energyRestoreFraction: 1.0,
        clearsExhaustionTo: 0,
        canBeWoken: true,
        healPerTick: 4,
    },
    bedrollFire: {
        energyPerTick: 8,
        energyRestoreFraction: 0.8,
        clearsExhaustionTo: 0,
        canBeWoken: true,
        healPerTick: 2.5,
    },
    bedrollAlone: {
        energyPerTick: 6,
        energyRestoreFraction: 0.6,
        clearsExhaustionTo: 1,
        canBeWoken: true,
        healPerTick: 1.5,
    },
    collapse: {
        energyPerTick: 2,
        energyRestoreFraction: 0.3,
        clearsExhaustionTo: 2,
        canBeWoken: false,
        healPerTick: 0.5,
    },
};

/**
 * Execute one tick of the sleep action. Increments the entity's energy by
 * energyPerTick each tick and completes once energy reaches energyTarget.
 * Each tick also restores HP based on sleep quality; fractional amounts
 * accumulate on the action data since heal() only applies whole points.
 * Exhaustion is cleared on completion. Collapse-quality sleep suppresses
 * replanning until complete.
 */
export function executeSleepAction(
    action: SleepActionData,
    entity: Entity,
): ActionResult {
    const params = sleepParamsByQuality[action.quality];

    const health = entity.getEcsComponent(HealthComponentId);
    if (health && health.currentHp < health.maxHp) {
        const accumulated = (action.healAccumulator ?? 0) + params.healPerTick;
        const wholeHeal = Math.floor(accumulated);
        action.healAccumulator = accumulated - wholeHeal;
        if (wholeHeal >= 1) {
            heal(health, wholeHeal);
            entity.invalidateComponent(HealthComponentId);
        }
    }

    const energy = entity.getEcsComponent(EnergyComponentId);
    if (energy) {
        energy.energy = Math.min(
            action.energyTarget,
            energy.energy + action.energyPerTick,
        );
        entity.invalidateComponent(EnergyComponentId);

        if (energy.energy >= action.energyTarget) {
            clearEntityExhaustion(entity, params.clearsExhaustionTo);
            return ActionComplete;
        }
    }

    return ActionRunning;
}
