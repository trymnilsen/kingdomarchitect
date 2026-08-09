import { clamp } from "../../common/number.ts";
import { TOTAL_CYCLE_TICKS } from "./dayComponent.ts";

/**
 * Marks an entity as a pile of items lying loose in the world, as opposed to a
 * collectable held by a building. A pile holds exactly one stack of one item
 * type; several stacks on the same tile are several entities.
 */
export type GroundItemComponent = {
    id: typeof GroundItemComponentId;
    /**
     * Simulation tick the pile was dropped or last topped up on. Decay is
     * derived from this single number, so nothing has to be ticked down.
     */
    droppedAtTick: number;
};

export const GroundItemComponentId = "GroundItem";

/**
 * How long a pile survives lying exposed before it rots away. Two full day
 * cycles: the duration has to comfortably exceed "rebuild a stockpile and haul
 * everything back", because if a raid razed the only stockpile then every
 * collect job is unclaimable until a new one stands. That pressure is intended,
 * but only with a generous clock.
 */
export const GROUND_ITEM_DECAY_TICKS = 2 * TOTAL_CYCLE_TICKS;

export function createGroundItemComponent(
    droppedAtTick: number,
): GroundItemComponent {
    return {
        id: GroundItemComponentId,
        droppedAtTick,
    };
}

/**
 * How far along its decay the pile is, from 0 (just dropped) to 1 (rotted).
 * Pure and derived, so callers may read it as often as they like.
 */
export function groundItemDecayFraction(
    component: GroundItemComponent,
    tick: number,
): number {
    const elapsed = tick - component.droppedAtTick;
    return clamp(elapsed / GROUND_ITEM_DECAY_TICKS, 0, 1);
}
