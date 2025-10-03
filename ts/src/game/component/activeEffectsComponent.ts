import type { Effect } from "../../data/effect/effect.js";

export type ActiveEffect = {
    effect: Effect;
    remainingTicks: number;
    ticksSinceLastApplication: number;
};

export type ActiveEffectsComponent = {
    id: typeof ActiveEffectsComponentId;
    effects: ActiveEffect[];
};

export function createActiveEffectsComponent(): ActiveEffectsComponent {
    return {
        id: ActiveEffectsComponentId,
        effects: [],
    };
}

export function addEffect(
    component: ActiveEffectsComponent,
    effect: Effect,
): void {
    const remainingTicks =
        effect.timing.type === "immediate"
            ? 0
            : effect.timing.type === "delayed"
              ? effect.timing.ticks
              : effect.timing.ticks;

    component.effects.push({
        effect,
        remainingTicks,
        ticksSinceLastApplication: 0,
    });
}

export function removeEffect(
    component: ActiveEffectsComponent,
    index: number,
): void {
    component.effects.splice(index, 1);
}

export const ActiveEffectsComponentId = "activeEffects";
