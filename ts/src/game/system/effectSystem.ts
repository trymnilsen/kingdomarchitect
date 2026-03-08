import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { createLogger } from "../../common/logging/logger.ts";
import type { Entity } from "../entity/entity.ts";
import {
    ActiveEffectsComponentId,
    type ActiveEffect,
    type ActiveEffectsComponent,
} from "../component/activeEffectsComponent.ts";
import type { EffectExecutor } from "../../data/effect/effectExecutorRegistry.ts";
import { StatsComponentId, markStatsDirty } from "../component/statsComponent.ts";

const log = createLogger("effect");

export function createEffectSystem(
    executors: ReadonlyMap<string, EffectExecutor>,
): EcsSystem {
    return {
        onUpdate: (root: Entity, tick: number) => {
            const entitiesWithEffects = root.queryComponents(ActiveEffectsComponentId);
            for (const [entity, effectsComponent] of entitiesWithEffects) {
                processEffects(entity, effectsComponent, tick, executors);
            }
        },
    };
}

function processEffects(
    entity: Entity,
    effectsComponent: ActiveEffectsComponent,
    tick: number,
    executors: ReadonlyMap<string, EffectExecutor>,
) {
    const effectsToRemove: number[] = [];

    for (let i = 0; i < effectsComponent.effects.length; i++) {
        const activeEffect = effectsComponent.effects[i];
        const effect = activeEffect.effect;

        switch (effect.timing.type) {
            case "immediate": {
                runExecutor(entity, activeEffect, tick, executors);
                effectsToRemove.push(i);
                break;
            }
            case "delayed": {
                activeEffect.remainingTicks--;
                if (activeEffect.remainingTicks <= 0) {
                    runExecutor(entity, activeEffect, tick, executors);
                    effectsToRemove.push(i);
                }
                break;
            }
            case "periodic": {
                activeEffect.ticksSinceLastApplication++;
                activeEffect.remainingTicks--;

                if (
                    activeEffect.ticksSinceLastApplication >=
                    effect.timing.interval
                ) {
                    runExecutor(entity, activeEffect, tick, executors);
                    activeEffect.ticksSinceLastApplication = 0;
                }

                if (activeEffect.remainingTicks <= 0) {
                    effectsToRemove.push(i);
                }
                break;
            }
            case "persistent": {
                // Persistent effects run every tick and are never auto-removed.
                // They must be explicitly removed via removeEffectsBySource.
                runExecutor(entity, activeEffect, tick, executors);
                break;
            }
        }
    }

    // Remove expired effects (reverse order to preserve indices)
    for (let i = effectsToRemove.length - 1; i >= 0; i--) {
        effectsComponent.effects.splice(effectsToRemove[i], 1);
    }

    entity.invalidateComponent(ActiveEffectsComponentId);

    // If any remaining effects carry stat modifiers, ensure stats are recomputed
    if (entity.hasComponent(StatsComponentId)) {
        const hasModifiers = effectsComponent.effects.some(
            (e) => Object.keys(e.modifiers).length > 0,
        );
        if (hasModifiers) {
            markStatsDirty(entity);
        }
    }
}

function runExecutor(
    entity: Entity,
    activeEffect: ActiveEffect,
    tick: number,
    executors: ReadonlyMap<string, EffectExecutor>,
): void {
    const executor = executors.get(activeEffect.effect.id);
    if (executor) {
        executor.execute(entity, activeEffect, tick);
    } else {
        log.warn("No executor registered for effect", {
            effectId: activeEffect.effect.id,
        });
    }
}
