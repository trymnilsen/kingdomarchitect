import { isPointAdjacentTo } from "../../../common/point.ts";
import { createLogger } from "../../../common/logging/logger.ts";
import { getProductionDefinition } from "../../../data/production/productionDefinition.ts";
import { spendEntityEnergy } from "../../component/energyComponent.ts";

const log = createLogger("behavior");
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../component/inventoryComponent.ts";
import { ProductionComponentId } from "../../component/productionComponent.ts";
import type { Entity } from "../../entity/entity.ts";
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

    if (action.progress === undefined) {
        action.progress = 0;
    }
    action.progress++;
    spendEntityEnergy(entity, 2);

    if (action.progress >= definition.duration) {
        const workerInventory =
            entity.requireEcsComponent(InventoryComponentId);
        addInventoryItem(
            workerInventory,
            definition.yield.item,
            definition.yield.amount,
        );
        entity.invalidateComponent(InventoryComponentId);

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
