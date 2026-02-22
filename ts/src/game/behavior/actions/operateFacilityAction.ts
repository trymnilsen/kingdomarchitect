import { isPointAdjacentTo } from "../../../common/point.ts";
import { getProductionDefinition } from "../../../data/production/productionDefinition.ts";
import { getResourceById } from "../../../data/inventory/items/naturalResource.ts";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../component/inventoryComponent.ts";
import { ProductionComponentId } from "../../component/productionComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { findRandomSpawnInDiamond } from "../../map/item/placement.ts";
import { resourcePrefab } from "../../prefab/resourcePrefab.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import { findJobClaimedBy, completeJobFromQueue } from "../../job/jobLifecycle.ts";
import {
    ActionComplete,
    ActionRunning,
    type ActionResult,
    type BehaviorActionData,
} from "./Action.ts";

const FORRESTER_RADIUS = 5;

/**
 * Operate a production facility (e.g., quarry, forrester).
 * Progress is stored on action.progress since no component tracks work duration.
 * Assumes worker is already adjacent to building (moveTo should have run first).
 */
export function executeOperateFacilityAction(
    action: Extract<BehaviorActionData, { type: "operateFacility" }>,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const buildingEntity = root.findEntity(action.buildingId);

    if (!buildingEntity) {
        console.warn(
            `[OperateFacility] Building ${action.buildingId} not found`,
        );
        return { kind: "failed", cause: { type: "targetGone", entityId: action.buildingId } };
    }

    if (!isPointAdjacentTo(buildingEntity.worldPosition, entity.worldPosition)) {
        console.warn(`[OperateFacility] Worker not adjacent to building`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const productionComp =
        buildingEntity.getEcsComponent(ProductionComponentId);
    if (!productionComp) {
        console.warn(
            `[OperateFacility] Building ${action.buildingId} has no ProductionComponent`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const definition = getProductionDefinition(productionComp.productionId);
    if (!definition) {
        console.warn(
            `[OperateFacility] Unknown production: ${productionComp.productionId}`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    if (action.progress === undefined) {
        action.progress = 0;
    }
    action.progress++;

    if (action.progress >= definition.duration) {
        const yieldDef = definition.yield;

        if (yieldDef.type === "item") {
            const workerInventory =
                entity.requireEcsComponent(InventoryComponentId);
            addInventoryItem(workerInventory, yieldDef.item, yieldDef.amount);
            entity.invalidateComponent(InventoryComponentId);
        } else if (yieldDef.type === "entity") {
            const chunkMapComp = root.getEcsComponent(ChunkMapComponentId);
            if (chunkMapComp) {
                const spawnPosition = findRandomSpawnInDiamond(
                    buildingEntity.worldPosition,
                    FORRESTER_RADIUS,
                    chunkMapComp.chunkMap,
                );

                if (spawnPosition) {
                    const resource = getResourceById(yieldDef.resourceId);
                    if (resource) {
                        const spawnedEntity = resourcePrefab(resource);
                        spawnedEntity.worldPosition = spawnPosition;
                        root.addChild(spawnedEntity);
                    }
                }
            }
        }

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
