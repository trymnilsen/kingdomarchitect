/**
 * Component that tracks hunger for entities that need to eat.
 * Hunger ranges from 0 (full) to 100 (starving).
 */
export type HungerComponent = {
    id: typeof HungerComponentId;

    /** Current hunger level (0-100) */
    hunger: number;

    /** Rate at which hunger increases per second */
    hungerRate: number;
};

export const HungerComponentId = "Hunger";

/**
 * Create a new hunger component with default values.
 */
export function createHungerComponent(
    initialHunger: number = 0,
    hungerRate: number = 1,
): HungerComponent {
    return {
        id: HungerComponentId,
        hunger: initialHunger,
        hungerRate,
    };
}

/**
 * Increase hunger by the specified amount.
 * Hunger is clamped to a maximum of 100.
 */
export function increaseHunger(
    component: HungerComponent,
    amount: number,
): void {
    component.hunger = Math.min(100, component.hunger + amount);
}

/**
 * Decrease hunger by the specified amount (i.e., eat food).
 * Hunger is clamped to a minimum of 0.
 */
export function decreaseHunger(
    component: HungerComponent,
    amount: number,
): void {
    component.hunger = Math.max(0, component.hunger - amount);
}
