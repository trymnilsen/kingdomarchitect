import type { ActiveEffect } from "../../game/component/activeEffectsComponent.ts";
import type { Entity } from "../../game/entity/entity.ts";
import { healEffectExecutor } from "./health/healEffect.ts";

export type EffectExecutor = {
    effectId: string;
    execute: (entity: Entity, activeEffect: ActiveEffect, tick: number) => void;
};

export function createEffectExecutorMap(): ReadonlyMap<string, EffectExecutor> {
    const executors: EffectExecutor[] = [healEffectExecutor];
    return new Map(executors.map((e) => [e.effectId, e]));
}
