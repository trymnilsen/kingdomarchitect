import { log } from "../../../common/logging/logger.ts";
import type { Point } from "../../../common/point.ts";
import { getProductionDefinition } from "../../../data/production/productionDefinition.ts";
import { getResourceById } from "../../../data/inventory/items/naturalResource.ts";
import { spendEntityEnergy } from "../../component/energyComponent.ts";
import { ProductionComponentId } from "../../component/productionComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { resourcePrefab } from "../../prefab/resourcePrefab.ts";
import { completeClaimedJob } from "../../job/jobLifecycle.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./action.ts";

export type PlantTreeActionData = {
    type: "plantTree";
    buildingId: string;
    targetPosition: Point;
    progress?: number;
};

/**
 * Plant a tree entity at targetPosition.
 * The worker should already be standing at targetPosition (moveTo with no stopAdjacent).
 * On completion the spawned entity is added to the world at targetPosition.
 */
export function executePlantTreeAction(
    action: PlantTreeActionData,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const buildingEntity = root.findEntity(action.buildingId);

    if (!buildingEntity) {
        log.warn(`Building ${action.buildingId} not found`);
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.buildingId },
        };
    }

    const productionComp = buildingEntity.getEcsComponent(
        ProductionComponentId,
    );
    if (!productionComp) {
        log.warn(`Building ${action.buildingId} has no ProductionComponent`);
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const definition = getProductionDefinition(productionComp.productionId);
    if (!definition || definition.kind !== "zone") {
        log.warn(
            `plantTree called on non-zone building: ${productionComp.productionId}`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    if (action.progress === undefined) {
        action.progress = 0;
    }
    action.progress++;
    spendEntityEnergy(entity, 2);

    if (action.progress >= definition.plantDuration) {
        const resource = getResourceById(definition.plantResourceId);
        if (!resource) {
            log.warn(`Unknown plant resource: ${definition.plantResourceId}`);
            return { kind: "failed", cause: { type: "unknown" } };
        }

        const spawned = resourcePrefab(resource);
        root.addChild(spawned);
        spawned.worldPosition = action.targetPosition;

        completeClaimedJob(entity);
        return ActionComplete;
    }

    return ActionRunning;
}
