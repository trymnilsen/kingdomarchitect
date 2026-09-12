import { isAtOrAdjacent } from "../../../common/point.ts";
import { log } from "../../../common/logging/logger.ts";
import type { Point } from "../../../common/point.ts";
import { getProductionDefinition } from "../../../data/production/productionDefinition.ts";
import { getResourceById } from "../../../data/inventory/items/naturalResource.ts";
import { spendEntityEnergy } from "../../component/energyComponent.ts";
import { ProductionComponentId } from "../../component/productionComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { resourcePrefab } from "../../prefab/resourcePrefab.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./action.ts";

export type PlantTreeActionData = {
    type: "plantTree";
    buildingId: string;
    targetPosition: Point;
    resourceIdToPlant: string;
    progress?: number;
};

/**
 * Plant a tree at targetPosition. The worker stands next to the spot, since a
 * free tile is one no entity occupies and the worker is an entity.
 *
 * Planting never completes the production order. An order is one tree's worth
 * of timber, and planting is the upkeep that makes the next felling possible,
 * so the order is retired by the chop that follows.
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

    if (!isAtOrAdjacent(action.targetPosition, entity.worldPosition)) {
        log.warn(`Worker not at or adjacent to the planting spot`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
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

    const resource = getResourceById(action.resourceIdToPlant);
    if (!resource) {
        log.warn(`Unknown plant resource: ${action.resourceIdToPlant}`);
        return { kind: "failed", cause: { type: "unknown" } };
    }

    if (action.progress === undefined) {
        action.progress = 0;
    }
    action.progress++;
    spendEntityEnergy(entity, 2);

    if (action.progress >= definition.plantDuration) {
        const spawned = resourcePrefab(resource);
        root.addChild(spawned);
        spawned.worldPosition = action.targetPosition;

        return ActionComplete;
    }

    return ActionRunning;
}
