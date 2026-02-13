/**
 * Component that tracks warmth for entities.
 * Warmth ranges from 0 (freezing) to 100 (fully warm).
 * Goblins become cold when warmth drops below 70.
 */
export type WarmthComponent = {
    id: typeof WarmthComponentId;

    /** Current warmth level (0-100) */
    warmth: number;

    /** Rate at which warmth decreases per tick */
    decayRate: number;
};

export const WarmthComponentId = "Warmth";

/**
 * Create a new warmth component with default values.
 */
export function createWarmthComponent(
    initialWarmth: number = 80,
    decayRate: number = 1.0,
): WarmthComponent {
    return {
        id: WarmthComponentId,
        warmth: initialWarmth,
        decayRate,
    };
}

/**
 * Increase warmth by the specified amount.
 * Warmth is clamped to a maximum of 100.
 */
export function increaseWarmth(
    component: WarmthComponent,
    amount: number,
): void {
    component.warmth = Math.min(100, component.warmth + amount);
}

/**
 * Decrease warmth by the specified amount.
 * Warmth is clamped to a minimum of 0.
 */
export function decreaseWarmth(
    component: WarmthComponent,
    amount: number,
): void {
    component.warmth = Math.max(0, component.warmth - amount);
}

/**
 * Check if entity is warm (warmth >= 70).
 */
export function isWarm(component: WarmthComponent): boolean {
    return component.warmth >= 70;
}

/**
 * Check if entity is cold (warmth < 70).
 */
export function isCold(component: WarmthComponent): boolean {
    return component.warmth < 70;
}
