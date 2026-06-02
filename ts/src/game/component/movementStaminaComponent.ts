/**
 * Tracks recent movement history for an entity to support displacement negotiation.
 * The rolling buffer of tick numbers backs the hard one-move-per-tick gate
 * (`hasMovedThisTick`) — has this entity already moved this tick? — which prevents
 * double-movement and lets the transaction commit detect stale negotiations.
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
