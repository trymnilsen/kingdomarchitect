import { isPointAdjacentTo, type Point } from "../../common/point.js";
import { buildingAdjecency } from "../../data/building/buildings.js";
import {
    AdjacencyMask,
    adjacencyMaskToEnum,
    createAdjacencyMask,
} from "../../common/adjacency.js";
import { queryAdjacentEntities } from "../map/query/queryEntity.js";
import { BuildingComponentId } from "../component/buildingComponent.js";
import { heal, HealthComponentId } from "../component/healthComponent.js";
import { SpriteComponentId } from "../component/spriteComponent.js";
import type { Entity } from "../entity/entity.js";
import { completeJob, type Job, type JobHandler } from "./job.js";
import { doMovement, MovementResult } from "./movementHelper.js";

export interface BuildBuildingJob extends Job {
    id: typeof BuildBuildingJobId;
    entityId: string;
}

export function BuildBuildingJob(entity: Entity): BuildBuildingJob {
    return {
        id: BuildBuildingJobId,
        entityId: entity.id,
    };
}

export const BuildBuildingJobId = "buildBuildingJob";

export const buildBuildingHandler: JobHandler<BuildBuildingJob> = (
    root,
    runner,
    job,
) => {
    const buildingEntity = root.findEntity(job.entityId);
    const buildingComponent =
        buildingEntity?.getEcsComponent(BuildingComponentId);

    if (!buildingEntity) {
        throw new Error(`Unable to find entity with entityId ${job.entityId}`);
    }

    if (!buildingComponent) {
        throw new Error(`No building component on entity ${job.entityId}`);
    }

    if (isPointAdjacentTo(buildingEntity.worldPosition, runner.worldPosition)) {
        const healthComponent =
            buildingEntity.requireEcsComponent(HealthComponentId);
        heal(healthComponent, 10);
        buildingEntity.invalidateComponent(HealthComponentId);
        if (healthComponent.currentHp >= healthComponent.maxHp) {
            const spriteComponent =
                buildingEntity.getEcsComponent(SpriteComponentId);
            buildingComponent.scaffolded = false;
            // Update the sprite of the building
            if (!!spriteComponent) {
                const adjacency =
                    buildingAdjecency[buildingComponent.building.id];
                if (adjacency) {
                    // Update this building and any adjacent ones with the same building type
                    updateBuildingAdjacency(
                        root,
                        buildingEntity,
                        buildingComponent.building.id,
                    );
                } else {
                    spriteComponent.sprite = buildingComponent.building.icon;
                }
            }
            buildingEntity.invalidateComponent(BuildingComponentId);
            buildingEntity.invalidateComponent(SpriteComponentId);
            completeJob(runner);
        }
    } else {
        const movement = doMovement(runner, buildingEntity.worldPosition);
        if (movement == MovementResult.Failure) {
            completeJob(runner);
        }
    }
};

/**
 * Calculate the adjacency mask for a building at a given position
 */
function calculateAdjacencyMask(
    root: Entity,
    position: Point,
    buildingId: string,
): AdjacencyMask {
    const adjacentEntities = queryAdjacentEntities(root, position);

    const hasMatchingBuilding = (entities: Entity[]): boolean => {
        return entities.some((entity) => {
            const bc = entity.getEcsComponent(BuildingComponentId);
            return bc && bc.building.id === buildingId && !bc.scaffolded;
        });
    };

    return createAdjacencyMask(
        hasMatchingBuilding(adjacentEntities.left),
        hasMatchingBuilding(adjacentEntities.right),
        hasMatchingBuilding(adjacentEntities.up),
        hasMatchingBuilding(adjacentEntities.down),
    );
}

/**
 * Update the adjacency and sprite for a single building entity
 */
function updateSingleBuildingAdjacency(
    entity: Entity,
    buildingId: string,
    root: Entity,
): void {
    const buildingComponent = entity.getEcsComponent(BuildingComponentId);
    const spriteComponent = entity.getEcsComponent(SpriteComponentId);
    const adjacencyFunction = buildingAdjecency[buildingId];

    if (!buildingComponent || !spriteComponent || !adjacencyFunction) {
        return;
    }

    // Calculate new adjacency
    const adjacencyMask = calculateAdjacencyMask(
        root,
        entity.worldPosition,
        buildingId,
    );
    const adjacencyEnum = adjacencyMaskToEnum(adjacencyMask);

    // Update the building component
    buildingComponent.adjacency = adjacencyEnum;

    // Update the sprite
    spriteComponent.sprite = adjacencyFunction(adjacencyEnum);

    // Invalidate components to trigger updates
    entity.invalidateComponent(BuildingComponentId);
    entity.invalidateComponent(SpriteComponentId);
}

/**
 * Update building adjacency for the target building and all adjacent buildings of the same type
 */
function updateBuildingAdjacency(
    root: Entity,
    targetEntity: Entity,
    buildingId: string,
): void {
    // Update the target building first
    updateSingleBuildingAdjacency(targetEntity, buildingId, root);

    // Find and update all adjacent buildings of the same type
    const adjacentEntities = queryAdjacentEntities(
        root,
        targetEntity.worldPosition,
    );
    const allAdjacent = [
        ...adjacentEntities.left,
        ...adjacentEntities.right,
        ...adjacentEntities.up,
        ...adjacentEntities.down,
    ];

    for (const entity of allAdjacent) {
        const bc = entity.getEcsComponent(BuildingComponentId);
        if (bc && bc.building.id === buildingId && !bc.scaffolded) {
            updateSingleBuildingAdjacency(entity, buildingId, root);
        }
    }
}
