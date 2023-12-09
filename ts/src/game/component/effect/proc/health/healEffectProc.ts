import { Effect } from "../../../../../data/effect/effect.js";
import {
    HealEffect,
    healEffectId,
} from "../../../../../data/effect/health/healEffect.js";
import { Entity } from "../../../../entity/entity.js";
import { HealthComponent } from "../../../health/healthComponent.js";
import { EffectProcResult } from "../../effectProcResult.js";

export function healEffectProc(
    effect: Effect,
    entity: Entity,
): EffectProcResult {
    if (!isHealEffect(effect)) {
        return EffectProcResult.Remove;
    }

    const healthComponent = entity.getComponent(HealthComponent);
    if (!healthComponent) {
        return EffectProcResult.Remove;
    }

    healthComponent.heal(effect.data.amount);
    return EffectProcResult.Continue;
}

function isHealEffect(effect: Effect): effect is HealEffect {
    return effect.id == healEffectId;
}
