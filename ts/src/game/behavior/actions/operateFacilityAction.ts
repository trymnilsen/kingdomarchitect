import { isPointAdjacentTo } from "../../../common/point.ts";
import { createLogger } from "../../../common/logging/logger.ts";
import {
    getProductionDefinition,
    type ProductionDefinition,
} from "../../../data/production/productionDefinition.ts";
import { spendEntityEnergy } from "../../component/energyComponent.ts";

const log = createLogger("behavior");
import {
    addToHeldItem,
    HeldItemComponentId,
    isHeldEmpty,
    type HeldItemComponent,
} from "../../component/heldItemComponent.ts";
import { ProductionComponentId } from "../../component/productionComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { findAcceptingStockpile } from "../../entity/findAcceptingStockpile.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import {
    findJobClaimedBy,
    completeJobFromQueue,
} from "../../job/jobLifecycle.ts";
import {
    ActionComplete,
    ActionRunning,
    type ActionResult,
} from "./Action.ts";

export type OperateFacilityActionData = {
    type: "operateFacility";
    buildingId: string;
    progress?: number;
};

/**
 * Operate an extract production facility (e.g., quarry).
 * Progress is stored on action.progress since no component tracks work duration.
 * Assumes worker is already adjacent to building (moveTo should have run first).
 */
export function executeOperateFacilityAction(
    action: OperateFacilityActionData,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const buildingEntity = root.findEntity(action.buildingId);

    if (!buildingEntity) {
        log.warn(
            `Building ${action.buildingId} not found`,
        );
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.buildingId },
        };
    }

    if (
        !isPointAdjacentTo(buildingEntity.worldPosition, entity.worldPosition)
    ) {
        log.warn(`Worker not adjacent to building`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const productionComp = buildingEntity.getEcsComponent(
        ProductionComponentId,
    );
    if (!productionComp) {
        log.warn(
            `Building ${action.buildingId} has no ProductionComponent`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const definition = getProductionDefinition(productionComp.productionId);
    if (!definition) {
        log.warn(
            `Unknown production: ${productionComp.productionId}`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    if (definition.kind !== "extract") {
        log.warn(
            `operateFacility called on non-extract building: ${productionComp.productionId}`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const held = entity.requireEcsComponent(HeldItemComponentId);

    // The held slot is single-item-id. If the worker is already holding a
    // different item the mined yield cannot land there, so free the hand first
    // and resume mining into an empty slot rather than failing — a failure
    // would unclaim the job and restart the whole extraction from scratch.
    if (heldBlocksYield(held, definition)) {
        return freeHandSubaction(entity, buildingEntity, held);
    }

    if (action.progress === undefined) {
        action.progress = 0;
    }
    action.progress++;
    spendEntityEnergy(entity, 2);

    if (action.progress >= definition.duration) {
        addToHeldItem(
            held,
            structuredClone(definition.yield.item),
            definition.yield.amount,
        );
        entity.invalidateComponent(HeldItemComponentId);

        const queueEntity = entity.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            const job = findJobClaimedBy(queueEntity, entity.id);
            if (job) {
                completeJobFromQueue(queueEntity, job);
            }
        }
        return ActionComplete;
    }

    return ActionRunning;
}

/**
 * True when the held slot holds an item whose id differs from the facility's
 * yield — i.e. depositing would require mixing two item ids in one slot.
 */
function heldBlocksYield(
    held: HeldItemComponent,
    definition: Extract<ProductionDefinition, { kind: "extract" }>,
): boolean {
    if (isHeldEmpty(held)) return false;
    return held.item!.id !== definition.yield.item.id;
}

/**
 * Emit a subaction chain that empties the worker's hand so the suspended
 * extraction can resume. Prefers depositing into an accepting stockpile
 * (walking there and back to the facility), and falls back to dropping the
 * held item where the worker stands when no stockpile will take it.
 */
function freeHandSubaction(
    worker: Entity,
    buildingEntity: Entity,
    held: HeldItemComponent,
): ActionResult {
    const stockpile = findAcceptingStockpile(worker, held.item!.id);
    if (stockpile) {
        return {
            kind: "subaction",
            actions: [
                {
                    type: "moveTo",
                    target: stockpile.worldPosition,
                    stopAdjacent: "cardinal",
                },
                {
                    type: "depositToStockpile",
                    stockpileId: stockpile.id,
                },
                {
                    type: "moveTo",
                    target: buildingEntity.worldPosition,
                    stopAdjacent: "cardinal",
                },
            ],
        };
    }

    return {
        kind: "subaction",
        actions: [{ type: "dropHeld" }],
    };
}
