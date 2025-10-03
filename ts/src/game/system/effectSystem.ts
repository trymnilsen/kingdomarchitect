import type { EcsSystem } from "../../common/ecs/ecsSystem.js";
import type { Entity } from "../entity/entity.js";
import {
    ActiveEffectsComponentId,
    type ActiveEffectsComponent,
} from "../component/activeEffectsComponent.js";
import { HealthComponentId } from "../component/healthComponent.js";
import { heal } from "../component/healthComponent.js";
import { healEffectId } from "../../data/effect/health/healEffect.js";
import type { HealEffectData } from "../../data/effect/health/healEffect.js";
import type { Effect } from "../../data/effect/effect.js";

export const effectSystem: EcsSystem = {
    onUpdate: update,
};

function update(root: Entity, _deltaTime: number) {
    const entitiesWithEffects = root.queryComponents(ActiveEffectsComponentId);

    for (const [entity, effectsComponent] of entitiesWithEffects) {
        processEffects(entity, effectsComponent);
    }
}

function processEffects(
    entity: Entity,
    effectsComponent: ActiveEffectsComponent,
) {
    const effectsToRemove: number[] = [];

    for (let i = 0; i < effectsComponent.effects.length; i++) {
        const activeEffect = effectsComponent.effects[i];
        const effect = activeEffect.effect;

        switch (effect.timing.type) {
            case "immediate": {
                // Apply immediately and mark for removal
                applyEffect(entity, effect);
                effectsToRemove.push(i);
                break;
            }
            case "delayed": {
                // Decrement ticks and apply when ready
                activeEffect.remainingTicks--;
                if (activeEffect.remainingTicks <= 0) {
                    applyEffect(entity, effect);
                    effectsToRemove.push(i);
                }
                break;
            }
            case "periodic": {
                // Apply every interval ticks
                activeEffect.ticksSinceLastApplication++;
                activeEffect.remainingTicks--;

                if (
                    activeEffect.ticksSinceLastApplication >=
                    effect.timing.interval
                ) {
                    applyEffect(entity, effect);
                    activeEffect.ticksSinceLastApplication = 0;
                }

                // Remove when duration is over
                if (activeEffect.remainingTicks <= 0) {
                    effectsToRemove.push(i);
                }
                break;
            }
        }
    }

    // Remove expired effects (in reverse order to maintain indices)
    for (let i = effectsToRemove.length - 1; i >= 0; i--) {
        effectsComponent.effects.splice(effectsToRemove[i], 1);
    }

    // Notify if effects changed
    if (effectsToRemove.length > 0) {
        entity.invalidateComponent(ActiveEffectsComponentId);
    }
}

function applyEffect(entity: Entity, effect: Effect): void {
    switch (effect.id) {
        case healEffectId: {
            const healthComponent = entity.getEcsComponent(HealthComponentId);
            if (healthComponent) {
                const data = effect.data as HealEffectData;
                heal(healthComponent, data.amount);
                entity.invalidateComponent(HealthComponentId);
            }
            break;
        }
        // Add more effect types here as needed
        default:
            console.warn(`Unknown effect type: ${effect.id}`);
    }
}
