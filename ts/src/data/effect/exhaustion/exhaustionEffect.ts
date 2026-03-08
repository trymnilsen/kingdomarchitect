import type { Effect } from "../effect.ts";
import type { EffectExecutor } from "../effectExecutorRegistry.ts";
import { EnergyComponentId } from "../../../game/component/energyComponent.ts";
import {
    damage,
    HealthComponentId,
} from "../../../game/component/healthComponent.ts";
import { markStatsDirty } from "../../../game/component/statsComponent.ts";
import type { StatModifiers } from "../../../game/stat/statType.ts";

export const exhaustionEffectId = "exhaustion";

export const exhaustionEffect: Effect = {
    id: exhaustionEffectId,
    timing: { type: "persistent" },
    data: {},
    name: "Exhaustion",
    sprite: "empty_sprite",
};

const modifiersByLevel: Record<number, StatModifiers> = {
    0: {},
    1: {
        might: { percent: -0.15 },
        wit: { flat: -1 },
    },
    2: {
        might: { percent: -0.3 },
        wit: { percent: -0.2, flat: -1 },
        presence: { flat: -1 },
    },
    3: {
        might: { percent: -0.5 },
        wit: { percent: -0.4, flat: -2 },
        presence: { flat: -2 },
        valor: { flat: -1 },
    },
    4: {
        might: { percent: -0.6 },
        wit: { percent: -0.5, flat: -3 },
        presence: { flat: -3 },
        valor: { flat: -2 },
    },
};

export const exhaustionEffectExecutor: EffectExecutor = {
    effectId: exhaustionEffectId,
    execute: (entity, activeEffect, _tick) => {
        const energy = entity.getEcsComponent(EnergyComponentId);
        if (!energy) return;

        const level = energy.exhaustionLevel;
        const newModifiers = modifiersByLevel[level] ?? {};

        // Only dirty stats if modifiers actually changed
        const currentJson = JSON.stringify(activeEffect.modifiers);
        const newJson = JSON.stringify(newModifiers);
        if (currentJson !== newJson) {
            activeEffect.modifiers = { ...newModifiers };
            markStatsDirty(entity);
        }

        // Level 4: deal periodic HP damage
        if (level >= 4) {
            if (activeEffect.state["damageTimer"] === undefined) {
                activeEffect.state["damageTimer"] = 0;
            }
            (activeEffect.state["damageTimer"] as number)++;
            if ((activeEffect.state["damageTimer"] as number) >= 10) {
                activeEffect.state["damageTimer"] = 0;
                const health = entity.getEcsComponent(HealthComponentId);
                if (health) {
                    damage(health, 5);
                    entity.invalidateComponent(HealthComponentId);
                }
            }
        } else {
            // Reset timer when not at level 4
            activeEffect.state["damageTimer"] = 0;
        }
    },
};
