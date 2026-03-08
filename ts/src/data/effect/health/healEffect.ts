import type { Effect } from "../effect.ts";
import type { EffectExecutor } from "../effectExecutorRegistry.ts";
import {
    heal,
    HealthComponentId,
} from "../../../game/component/healthComponent.ts";

export type HealEffectData = {
    amount: number;
};

export const healEffectId = "healingEffect";
export type HealEffect = Effect<HealEffectData>;

export const healEffectExecutor: EffectExecutor = {
    effectId: healEffectId,
    execute: (entity, activeEffect) => {
        const healthComponent = entity.getEcsComponent(HealthComponentId);
        if (healthComponent) {
            const data = activeEffect.effect.data as HealEffectData;
            heal(healthComponent, data.amount);
            entity.invalidateComponent(HealthComponentId);
        }
    },
};

/**
 * Creates an immediate healing effect
 */
export function createHealEffect(amount: number): HealEffect {
    return {
        data: {
            amount: amount,
        },
        id: healEffectId,
        name: "Healing",
        sprite: "health_potion",
        timing: { type: "immediate" },
    };
}

/**
 * Creates a healing effect that applies over time
 */
export function createHealOverTimeEffect(
    amount: number,
    ticks: number,
    interval: number = 1,
): HealEffect {
    return {
        data: {
            amount: amount,
        },
        id: healEffectId,
        name: "Regeneration",
        sprite: "health_potion",
        timing: { type: "periodic", ticks, interval },
    };
}
