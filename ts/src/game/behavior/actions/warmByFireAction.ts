import { FireSourceComponentId } from "../../component/fireSourceComponent.ts";
import {
    WarmthComponentId,
    increaseWarmth,
} from "../../component/warmthComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { log } from "../../../common/logging/logger.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./action.ts";

export type WarmByFireActionData = { type: "warmByFire"; fireEntityId: string };

/**
 * Warm by fire action - recovers warmth while near an active fire source,
 * diagonals included (see the `near` reach). Returns complete when warmth
 * reaches 100.
 */
export function executeWarmByFireAction(
    action: WarmByFireActionData,
    entity: Entity,
): ActionResult {
    const warmth = entity.getEcsComponent(WarmthComponentId);

    if (!warmth) {
        log.warn(`Entity ${entity.id} has no warmth component`);
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const root = entity.getRootEntity();
    const fireEntity = root.findEntity(action.fireEntityId);

    if (!fireEntity) {
        log.warn(`Fire entity ${action.fireEntityId} not found`);
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.fireEntityId },
        };
    }

    const fireSource = fireEntity.getEcsComponent(FireSourceComponentId);

    if (!fireSource) {
        log.warn(`Entity ${action.fireEntityId} has no FireSourceComponent`);
        return { kind: "failed", cause: { type: "unknown" } };
    }

    if (!fireSource.isActive) {
        log.warn(`Fire is not active`);
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.fireEntityId },
        };
    }

    // Apply active warming rate
    increaseWarmth(warmth, fireSource.activeWarmthRate);
    entity.invalidateComponent(WarmthComponentId);

    // Complete at 100 (fully warm), not at COLD_THRESHOLD (50).
    // If we stopped at 50 the goblin would immediately be eligible for keepWarm
    // again on the very next tick and thrash between warming and working.
    // Warming to full gives it a long buffer before the next keepWarm activation.
    if (warmth.warmth >= 90) {
        log.info(`Entity ${entity.id} is fully warm`);
        return ActionComplete;
    }

    return ActionRunning;
}
