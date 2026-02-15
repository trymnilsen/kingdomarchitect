import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import type { Entity } from "../entity/entity.ts";
import type { Point } from "../../common/point.ts";
import {
    WarmthComponentId,
    decreaseWarmth,
    increaseWarmth,
} from "../component/warmthComponent.ts";
import { FireSourceComponentId } from "../component/fireSourceComponent.ts";
import { requestReplan } from "../component/BehaviorAgentComponent.ts";

export const WARMTH_DECAY_TICK_INTERVAL = 10;

/**
 * Check if two points are within 1 tile of each other (8-directional adjacency).
 * Uses chebyshev distance (max of abs differences).
 */
function isWithinOneTile(a: Point, b: Point): boolean {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return Math.max(dx, dy) <= 1;
}

/**
 * System that handles warmth decay and passive fire warming.
 * - Decreases warmth for all entities with WarmthComponent by decayRate per tick
 * - Entities adjacent to active fire sources (8 tiles) receive passive warmth
 */
export const warmthSystem: EcsSystem = {
    onUpdate: (root: Entity, tick: number) => {
        const entitiesWithWarmth = root.queryComponents(WarmthComponentId);
        const fireSources = root.queryComponents(FireSourceComponentId);

        // Build list of active fire positions with their passive rates
        const activeFirePositions: Array<{
            position: Point;
            passiveRate: number;
        }> = [];

        for (const [fireEntity, fireComponent] of fireSources) {
            if (fireComponent.isActive) {
                activeFirePositions.push({
                    position: fireEntity.worldPosition,
                    passiveRate: fireComponent.passiveWarmthRate,
                });
            }
        }

        for (const [entity, warmthComponent] of entitiesWithWarmth) {
            const currentWarmth = warmthComponent.warmth;
            // Apply decay
            if (tick % WARMTH_DECAY_TICK_INTERVAL == 0) {
                decreaseWarmth(warmthComponent, warmthComponent.decayRate);
            }

            // Check for passive warming from adjacent fires (8 tiles)
            for (const fire of activeFirePositions) {
                if (isWithinOneTile(entity.worldPosition, fire.position)) {
                    increaseWarmth(warmthComponent, fire.passiveRate);
                    break; // Only one fire bonus per tick
                }
            }
            if (warmthComponent.warmth !== currentWarmth) {
                entity.invalidateComponent(WarmthComponentId);

                // Log threshold crossings between warm and cold states
                const coldThreshold = 50;
                const wasCold = currentWarmth < coldThreshold;
                const isColdNow = warmthComponent.warmth < coldThreshold;
                if (wasCold !== isColdNow) {
                    if (isColdNow) {
                        console.log(
                            `[WarmthSystem] Entity ${entity.id} became cold (warmth: ${currentWarmth.toFixed(1)} -> ${warmthComponent.warmth.toFixed(1)})`,
                        );
                    } else {
                        console.log(
                            `[WarmthSystem] Entity ${entity.id} warmed up (warmth: ${currentWarmth.toFixed(1)} -> ${warmthComponent.warmth.toFixed(1)})`,
                        );
                    }
                    // Warmth state changed - wake behavior agent to re-evaluate
                    requestReplan(entity);
                }
            }
        }
    },
};
