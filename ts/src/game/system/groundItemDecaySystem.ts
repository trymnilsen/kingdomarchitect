import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import type { Entity } from "../entity/entity.ts";
import {
    GroundItemComponentId,
    groundItemDecayFraction,
} from "../component/groundItemComponent.ts";

/**
 * How often the sweep looks for rotted piles. Decay is derived from each pile's
 * drop tick, so the sweep only decides when the world notices — a pile may
 * linger up to this many ticks past its expiry, which at a two-day lifetime is
 * not something a player can perceive. Sweeping rarely keeps the cost off every
 * tick.
 */
export const DECAY_SWEEP_INTERVAL = 50;

/**
 * Removes ground piles that have lain out long enough to rot. Jobs still
 * targeting a removed pile fail gracefully on their own: planCollectItem drops
 * the job when the entity is gone, and collectItemsAction fails with
 * targetGone, so there is deliberately no second cleanup path here.
 */
export const groundItemDecaySystem: EcsSystem = {
    onUpdate: (root, tick) => {
        if (tick % DECAY_SWEEP_INTERVAL !== 0) {
            return;
        }

        const rotted: Entity[] = [];
        for (const [entity, groundItem] of root.queryComponents(
            GroundItemComponentId,
        )) {
            // A pile saved before piles had a decay clock has no drop tick, and
            // would otherwise read as NaN decay and lie there forever. Start its
            // clock now: the system that owns the clock is the one that fixes it,
            // so groundItemDecayFraction can stay pure.
            if (!Number.isFinite(groundItem.droppedAtTick)) {
                groundItem.droppedAtTick = tick;
                entity.invalidateComponent(GroundItemComponentId);
                continue;
            }

            if (groundItemDecayFraction(groundItem, tick) >= 1) {
                rotted.push(entity);
            }
        }

        for (const entity of rotted) {
            entity.remove();
        }
    },
};
