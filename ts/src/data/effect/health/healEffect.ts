import { Effect } from "../effect.ts";

export type HealEffectData = {
    amount: number;
};

export const healEffectId = "healingEffect";
export type HealEffect = Effect<HealEffectData>;

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
