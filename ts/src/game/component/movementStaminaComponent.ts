/**
 * Backs the one-move-per-tick gate used by displacement negotiation. An entity
 * that has already moved this tick cannot move again, which is also how the
 * transaction commit spots a negotiation that has gone stale.
 */
export type MovementStaminaComponent = {
    id: typeof MovementStaminaComponentId;

    /** The tick this entity last moved on, or -1 if it never has. */
    lastMoveTick: number;
};

export const MovementStaminaComponentId = "MovementStamina";

export function createMovementStaminaComponent(): MovementStaminaComponent {
    return {
        id: MovementStaminaComponentId,
        lastMoveTick: -1,
    };
}

export function recordMove(
    component: MovementStaminaComponent,
    tick: number,
): void {
    component.lastMoveTick = tick;
}

export function hasMovedThisTick(
    component: MovementStaminaComponent,
    tick: number,
): boolean {
    return component.lastMoveTick === tick;
}
