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
    /**
     * Energy restored per tick, as a fraction of maxEnergy (at sleepMultiplier
     * 1.0). Expressed as a fraction rather than a point count so that retuning
     * the energy pool leaves sleep duration, and therefore total HP healed per
     * sleep, unchanged.
     */
    energyFractionPerTick: number;
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
        energyFractionPerTick: 0.1,
        energyRestoreFraction: 1.0,
        clearsExhaustionTo: 0,
        canBeWoken: true,
        healPerTick: 4,
    },
    bedrollFire: {
        energyFractionPerTick: 0.08,
        energyRestoreFraction: 0.8,
        clearsExhaustionTo: 0,
        canBeWoken: true,
        healPerTick: 2.5,
    },
    bedrollAlone: {
        energyFractionPerTick: 0.06,
        energyRestoreFraction: 0.6,
        clearsExhaustionTo: 1,
        canBeWoken: true,
        healPerTick: 1.5,
    },
    collapse: {
        energyFractionPerTick: 0.02,
        energyRestoreFraction: 0.3,
        clearsExhaustionTo: 2,
        canBeWoken: false,
        healPerTick: 0.5,
    },
};

/**
 * Resolve the per-tick energy gain for a sleep quality against a concrete pool.
 * Floored for the same reason the target is: it keeps energy on whole points and
 * absorbs the binary representation error in the fraction literals, since
 * 300 * 0.08 evaluates to 24.000000000000004.
 *
 * The floor is held at a minimum of one point because a rate of zero would leave
 * the sleeper permanently short of the target, wedging the action forever. Small
 * pools sleep proportionally longer instead.
 */
export function resolveSleepEnergyPerTick(
    quality: SleepQuality,
    maxEnergy: number,
    sleepMultiplier: number,
): number {
    const params = sleepParamsByQuality[quality];
    const perTick = Math.max(
        1,
        Math.floor(maxEnergy * params.energyFractionPerTick),
    );
    return perTick / sleepMultiplier;
}

/**
 * Resolve the energy value a sleep of this quality restores up to. Only a house
 * fills the pool completely; rougher shelter tops out lower.
 */
export function resolveSleepEnergyTarget(
    quality: SleepQuality,
    maxEnergy: number,
): number {
    const params = sleepParamsByQuality[quality];
    return Math.floor(maxEnergy * params.energyRestoreFraction);
}

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
