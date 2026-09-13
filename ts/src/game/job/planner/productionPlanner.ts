import type { Point } from "../../../common/point.ts";
import { randomEntry } from "../../../common/array.ts";
import { getProductionDefinition } from "../../../data/production/productionDefinition.ts";
import {
    isChoppable,
    ResourceHarvestMode,
    type NaturalResource,
} from "../../../data/inventory/items/naturalResource.ts";
import type { BehaviorActionData } from "../../behavior/actions/actionData.ts";
import {
    ChunkMapComponentId,
    type ChunkMap,
} from "../../component/chunkMapComponent.ts";
import {
    getOutputPolicy,
    OutputPolicy,
} from "../../component/outputPolicyComponent.ts";
import { ProductionComponentId } from "../../component/productionComponent.ts";
import {
    getBiomeAtTile,
    TileComponentId,
    type TileComponent,
} from "../../component/tileComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { biomes } from "../../map/biome.ts";
import {
    findRandomSpawnInDiamond,
    getDiamondPoints,
    getResourcesInDiamond,
} from "../../map/item/placement.ts";
import { removeJobForWorker } from "../jobLifecycle.ts";
import type { ProductionJob } from "../productionJob.ts";
import { planDepositHeld } from "./planDepositHeld.ts";

export function planProduction(
    root: Entity,
    worker: Entity,
    job: ProductionJob,
): BehaviorActionData[] {
    const buildingEntity = root.findEntity(job.targetBuilding);

    if (!buildingEntity) {
        removeJobForWorker(worker, job);
        return [];
    }

    const productionComp = buildingEntity.getEcsComponent(
        ProductionComponentId,
    );
    if (!productionComp) {
        removeJobForWorker(worker, job);
        return [];
    }

    const definition = getProductionDefinition(productionComp.productionId);
    if (!definition) {
        removeJobForWorker(worker, job);
        return [];
    }

    const chunkMapComp = root.getEcsComponent(ChunkMapComponentId);
    if (!chunkMapComp) {
        removeJobForWorker(worker, job);
        return [];
    }

    const center = buildingEntity.worldPosition;
    // Plantable tiles = diamond tiles minus the center (building) tile.
    const plantableTiles =
        getDiamondPoints(center, definition.zoneRadius).length - 1;
    const target = Math.round(definition.maxTreeFraction * plantableTiles);
    const floor = Math.floor(definition.minTreeFraction * plantableTiles);

    const standing = getResourcesInDiamond(
        center,
        definition.zoneRadius,
        chunkMapComp.chunkMap,
        isChoppable,
    );

    // The tree to fell is drawn from the crop standing when the plan was made.
    // A sapling planted by this same plan does not exist yet, since plantTree
    // spawns it several ticks later at execution, so it can never be the tree
    // this order takes.
    let felling: Entity | null = null;
    if (standing.length >= floor && standing.length > 0) {
        felling = randomEntry(standing);
    }

    const actions: BehaviorActionData[] = [];

    if (standing.length < target) {
        const planting = planPlanting(
            root,
            center,
            definition.zoneRadius,
            chunkMapComp.chunkMap,
            job.targetBuilding,
        );
        actions.push(...planting);
    }

    if (felling) {
        const policy = getOutputPolicy(buildingEntity);
        // Hauling writes the timber into the worker's hands, so they have to be
        // empty first. Dropping never touches them, and a worker carrying
        // something can fell a tree without putting it down.
        if (policy === OutputPolicy.Haul) {
            actions.push(...planDepositHeld(worker));
        }
        actions.push(
            {
                type: "moveTo",
                target: felling.worldPosition,
                goal: { kind: "adjacent" },
            },
            {
                type: "harvestResource",
                entityId: felling.id,
                harvestAction: ResourceHarvestMode.Chop,
                outputPolicy: policy,
            },
        );
    }

    if (actions.length === 0) {
        // Nowhere to plant and nothing that may be felled. Drop the order
        // rather than hold a claim nobody can act on.
        removeJobForWorker(worker, job);
    }

    return actions;
}

/**
 * Walk to a free tile in the zone and plant what belongs there. Returns no
 * actions when the zone is full or the free tiles are all in biomes where
 * nothing grows.
 */
function planPlanting(
    root: Entity,
    center: Point,
    zoneRadius: number,
    chunkMap: ChunkMap,
    buildingId: string,
): BehaviorActionData[] {
    const tiles = root.getEcsComponent(TileComponentId);
    const spot = findRandomSpawnInDiamond(
        center,
        zoneRadius,
        chunkMap,
        (point) => nativeTreesAt(tiles, point).length > 0,
    );
    if (!spot) {
        return [];
    }

    const natives = nativeTreesAt(tiles, spot);
    return [
        {
            type: "moveTo",
            target: spot,
            goal: { kind: "adjacent" },
        },
        {
            type: "plantTree",
            buildingId,
            targetPosition: spot,
            resourceIdToPlant: randomEntry(natives).id,
        },
    ];
}

/**
 * The trees that belong on a tile. A zone can straddle a biome edge, so this
 * asks about the tile being planted rather than about the building, and a spot
 * in a biome where nothing woody grows yields nothing to plant.
 */
function nativeTreesAt(
    tiles: TileComponent | null,
    point: Point,
): readonly NaturalResource[] {
    if (!tiles) {
        return [];
    }
    const biome = getBiomeAtTile(tiles, point);
    if (!biome) {
        return [];
    }
    return biomes[biome].trees;
}
