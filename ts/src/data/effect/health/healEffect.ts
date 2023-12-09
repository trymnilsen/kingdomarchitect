import { Effect } from "../effect.js";

export type HealEffectData = {
    amount: number;
};

export const healEffectId = "healingEffect";
export type HealEffect = Effect<HealEffectData>;
export function createHealEffect(amount: number): HealEffect {
    return {
        data: {
            amount: amount,
        },
        id: healEffectId,
        name: "Healing",
        sprite: "health_potion",
        time: 60,
    };
}
