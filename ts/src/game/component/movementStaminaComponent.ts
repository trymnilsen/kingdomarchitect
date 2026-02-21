/**
 * Tracks recent movement history for an entity to support displacement negotiation.
 * The rolling buffer of tick numbers serves two purposes:
 *   1. Hard gate: has this entity already moved this tick? (prevents double-movement)
 *   2. Pressure: how often has this entity been shuffled recently? (increases displacement cost)
 * One array, one source of truth — no risk of lastMoveTick drifting out of sync with the buffer.
 */
export type MovementStaminaComponent = {
    id: typeof MovementStaminaComponentId;

    /** Rolling buffer of tick numbers when this entity moved. Newest entry is always last. */
    recentMoveTicks: number[];
};

export const MovementStaminaComponentId = "MovementStamina";

/** Maximum number of recent move ticks to retain in the buffer. */
const BUFFER_CAPACITY = 5;

export function createMovementStaminaComponent(): MovementStaminaComponent {
    return {
        id: MovementStaminaComponentId,
        recentMoveTicks: [],
    };
}

/**
 * Record that this entity moved at the given tick.
 * Pushes the tick to the end of the buffer, dropping the oldest entry if at capacity.
 */
export function recordMove(
    component: MovementStaminaComponent,
    tick: number,
): void {
    component.recentMoveTicks.push(tick);
    if (component.recentMoveTicks.length > BUFFER_CAPACITY) {
        component.recentMoveTicks.shift();
    }
}

/**
 * Returns true if the entity has already moved during this tick.
 * An empty buffer means the entity has never moved, so returns false.
 */
export function hasMovedThisTick(
    component: MovementStaminaComponent,
    tick: number,
): boolean {
    const len = component.recentMoveTicks.length;
    return len > 0 && component.recentMoveTicks[len - 1] === tick;
}

/**
 * Returns a 0.0–1.0 pressure value representing how frequently this entity
 * has been displaced recently. Higher values make displacement more expensive,
 * naturally routing negotiation away from frequently-shuffled entities.
 * Uses lazy evaluation — no per-tick system needed, computed on demand during negotiation.
 */
export function getMovementPressure(
    component: MovementStaminaComponent,
    currentTick: number,
    window: number = 10,
): number {
    const windowStart = currentTick - window;
    let count = 0;
    for (const tick of component.recentMoveTicks) {
        if (tick >= windowStart && tick <= currentTick) {
            count++;
        }
    }
    return Math.min(1.0, count / BUFFER_CAPACITY);
}
