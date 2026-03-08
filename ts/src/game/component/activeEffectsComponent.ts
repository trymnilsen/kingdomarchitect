import type { Effect } from "../../data/effect/effect.ts";
import type { StatModifiers } from "../stat/statType.ts";
import type { Entity } from "../entity/entity.ts";
import { markStatsDirty } from "./statsComponent.ts";

export type ActiveEffect = {
    effect: Effect;
    source: string;
    modifiers: StatModifiers;
    state: Record<string, unknown>;
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
    source: string,
): void {
    const remainingTicks =
        effect.timing.type === "immediate"
            ? 0
            : effect.timing.type === "delayed"
              ? effect.timing.ticks
              : effect.timing.ticks;

    component.effects.push({
        effect,
        source,
        modifiers: {},
        state: {},
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

export function removeEffectsBySource(
    entity: Entity,
    component: ActiveEffectsComponent,
    source: string,
): void {
    const before = component.effects.length;
    component.effects = component.effects.filter((e) => e.source !== source);
    if (component.effects.length !== before) {
        markStatsDirty(entity);
    }
}

export const ActiveEffectsComponentId = "activeEffects";
