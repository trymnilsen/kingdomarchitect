/**
 * Component that tracks warmth for entities (currently goblins only).
 * Warmth ranges from 0 (freezing) to 100 (fully warm).
 *
 * Warmth decays by decayRate every simulation tick (1 Hz). At the default rate
 * of 1.0/tick a goblin starting at 55 warmth will hit the cold threshold in
 * roughly 5 ticks, giving it a short window before keepWarmBehavior kicks in.
 * Fire warms at activeWarmthRate (default 15/tick), so recovery is fast relative
 * to decay — goblins spend most of their time working, not warming.
 */
export type WarmthComponent = {
    id: typeof WarmthComponentId;

    /** Current warmth level (0-100) */
    warmth: number;

    /** Rate at which warmth decreases per tick */
    decayRate: number;
};

export const WarmthComponentId = "Warmth";
export const COLD_THRESHOLD = 50;
// DEFAULT_WARMTH starts slightly above COLD_THRESHOLD so a newly spawned goblin
// has a few ticks to orient itself before keepWarmBehavior activates. If it
// started at exactly 50 it would immediately divert to warming rather than work.
export const DEFAULT_WARMTH = 55;

/**
 * Create a new warmth component with default values.
 */
export function createWarmthComponent(
    initialWarmth: number = DEFAULT_WARMTH,
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
 * Check if entity is warm (warmth >= 50).
 */
export function isWarm(component: WarmthComponent): boolean {
    return component.warmth >= COLD_THRESHOLD;
}

/**
 * Check if entity is cold (warmth < threshold).
 */
export function isCold(component: WarmthComponent): boolean {
    return component.warmth < COLD_THRESHOLD;
}
