import type { Entity } from "../entity/entity.ts";
import { createDeathGameEvent } from "../entity/event/deathGameEventData.ts";
import { ImmortalComponentId } from "./immortalComponent.ts";

export type HealthComponent = {
    id: typeof HealthComponentId;
    currentHp: number;
    maxHp: number;
};

export function createHealthComponent(
    currentHp: number,
    maxHp: number,
): HealthComponent {
    return {
        id: HealthComponentId,
        currentHp,
        maxHp,
    };
}

/**
 * Adds the provided amount of hitpoints to the health component.
 * A component cannot be healed past its max
 * @param component the component to add the hit points to
 * @param amount the amount of hitpoints to add. Decimal amounts are rounded down.
 * @returns the amount of hitpoints healed
 */
export function heal(component: HealthComponent, amount: number): number {
    const roundedAmount = Math.floor(amount);
    if (roundedAmount < 1) {
        return 0;
    }
    const newHp = component.currentHp + roundedAmount;
    const clampedAmount = Math.min(newHp, component.maxHp);
    const healedAmount = clampedAmount - component.currentHp;
    component.currentHp = clampedAmount;

    return healedAmount;
}

/**
 * Damages the target with the provided amount
 * @param component the component to add the hit points to
 * @param amount the amount of hitpoints to add. Decimal amounts are rounded down.
 * @returns the amount of damage done. damaging 10hp with only 4 will return 4
 */
export function damage(component: HealthComponent, amount: number): number {
    const roundedAmount = Math.floor(amount);
    if (roundedAmount < 1) {
        return 0;
    }
    const damageAmount = Math.min(component.currentHp, roundedAmount);
    component.currentHp -= damageAmount;
    return damageAmount;
}

/**
 * Apply damage to an entity. When the hit drops the entity to 0 hp, a
 * death event is bubbled and the entity is removed from its parent —
 * unless it has an ImmortalComponent, in which case it stays at 0 hp.
 * Bubbling happens before removal so the event can still travel up the
 * parent chain.
 *
 * @param entity The entity to damage
 * @param amount The amount of damage
 * @param tick Current simulation tick
 * @returns The actual damage dealt
 */
export function damageEntity(
    entity: Entity,
    amount: number,
    _tick: number,
): number {
    const health = entity.getEcsComponent(HealthComponentId);
    if (!health) {
        return 0;
    }

    const damageDealt = damage(health, amount);
    if (damageDealt <= 0) {
        return 0;
    }
    entity.invalidateComponent(HealthComponentId);

    if (
        health.currentHp <= 0 &&
        !entity.getEcsComponent(ImmortalComponentId)
    ) {
        entity.bubbleEvent(createDeathGameEvent(entity, entity.id));
        entity.remove();
    }

    return damageDealt;
}

export const HealthComponentId = "Health";
