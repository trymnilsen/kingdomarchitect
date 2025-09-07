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

export const HealthComponentId = "Health";
