import type { Effect } from "../../data/effect/effect.ts";
import type { Entity } from "../entity/entity.ts";
import {
    addEffectToEntity,
    removeEntityEffectsBySource,
} from "./activeEffectsComponent.ts";

export type EnergyComponent = {
    id: typeof EnergyComponentId;
    /** Current energy (0 to maxEnergy) */
    energy: number;
    /** Maximum energy */
    maxEnergy: number;
    /** Current exhaustion level (0-4). 0 is rested, 4 is collapsing. */
    exhaustionLevel: number;
    /** Accumulated energy debt from actions performed at 0 energy */
    exhaustionDebt: number;
    /** Debt required to increase exhaustion by one level */
    exhaustionDebtThreshold: number;
    /** Sleep duration multiplier (species-based). 1.0 for humans. */
    sleepMultiplier: number;
};

export const EnergyComponentId = "Energy";

export function createEnergyComponent(maxEnergy: number = 100): EnergyComponent {
    return {
        id: EnergyComponentId,
        energy: maxEnergy,
        maxEnergy,
        exhaustionLevel: 0,
        exhaustionDebt: 0,
        exhaustionDebtThreshold: 15,
        sleepMultiplier: 1.0,
    };
}

/**
 * Spend energy for an action. Deducts cost from current energy.
 * If energy would go below 0, clamps to 0 and routes overspend to exhaustion debt.
 * @returns The amount of energy that could not be covered (0 if fully covered)
 */
export function spendEnergy(component: EnergyComponent, cost: number): number {
    if (component.energy >= cost) {
        component.energy -= cost;
        return 0;
    }
    const overspend = cost - component.energy;
    component.energy = 0;
    addExhaustionDebt(component, overspend);
    return overspend;
}

/**
 * Add exhaustion debt and potentially increase exhaustion level.
 * @returns true if exhaustion level increased
 */
export function addExhaustionDebt(
    component: EnergyComponent,
    amount: number,
): boolean {
    component.exhaustionDebt += amount;
    if (component.exhaustionDebt >= component.exhaustionDebtThreshold) {
        component.exhaustionDebt = 0;
        if (component.exhaustionLevel < 4) {
            component.exhaustionLevel++;
            return true;
        }
    }
    return false;
}

/**
 * Clear exhaustion to a specific level and reset debt.
 */
export function clearExhaustion(
    component: EnergyComponent,
    toLevel: number,
): void {
    component.exhaustionLevel = Math.max(0, Math.min(4, toLevel));
    component.exhaustionDebt = 0;
}

// Inline effect object to avoid circular dependency with exhaustionEffect.ts
const exhaustionEffectObject: Effect = {
    id: "exhaustion",
    timing: { type: "persistent" },
    data: {},
    name: "Exhaustion",
    sprite: "empty_sprite",
};

/**
 * Spend energy on an entity, managing the exhaustion effect automatically.
 * This is the primary function actions should call when doing work.
 */
export function spendEntityEnergy(entity: Entity, cost: number): void {
    const energy = entity.getEcsComponent(EnergyComponentId);
    if (!energy) return;

    const previousLevel = energy.exhaustionLevel;
    spendEnergy(energy, cost);
    entity.invalidateComponent(EnergyComponentId);

    // If exhaustion just started, add the persistent effect
    if (previousLevel === 0 && energy.exhaustionLevel > 0) {
        addEffectToEntity(entity, exhaustionEffectObject, "exhaustion");
    }
}

/**
 * Clear exhaustion on an entity, removing the exhaustion effect if fully cleared.
 */
export function clearEntityExhaustion(entity: Entity, toLevel: number): void {
    const energy = entity.getEcsComponent(EnergyComponentId);
    if (!energy) return;

    clearExhaustion(energy, toLevel);
    entity.invalidateComponent(EnergyComponentId);

    if (energy.exhaustionLevel === 0) {
        removeEntityEffectsBySource(entity, "exhaustion");
    }
}
