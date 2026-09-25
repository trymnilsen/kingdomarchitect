import { log } from "../../../common/logging/logger.ts";
import { addPoint, type Point } from "../../../common/point.ts";
import {
    ChunkMapComponentId,
    getEntitiesAt,
    type ChunkMap,
} from "../../component/chunkMapComponent.ts";
import { GoblinCampComponentId } from "../../component/goblinCampComponent.ts";
import {
    createKingdomComponent,
    KingdomType,
} from "../../component/kingdomComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import { isDecorativeResource } from "../../../data/inventory/items/naturalResource.ts";
import { clearDecorativeResourcesAt } from "../../building/clearDecorativeResources.ts";
import { goblinCampPrefab } from "../../prefab/goblinCampPrefab.ts";
import { findClosestAvailablePosition } from "../query/closestPositionQuery.ts";
import {
    ChunkSize,
    getChunkBounds,
    getTerrainAtWorldPosition,
    type GeneratedTileChunk,
    type TileChunk,
} from "../chunk.ts";
import { isBuildableTerrain } from "../terrain.ts";

export const campAnchor: Point = { x: ChunkSize / 2, y: ChunkSize / 2 - 1 };

export function placeSettlement(chunk: TileChunk, chunkEntity: Entity) {
    const { camp } = goblinCampPrefab();
    // The camp's children (campfire and goblin) define the tiles it needs, so
    // the layout is read off the prefab instead of restated here.
    const footprint = camp.children.map((child) => child.position);

    const root = chunkEntity.getRootEntity();
    const chunkMap = root.requireEcsComponent(ChunkMapComponentId).chunkMap;
    const bounds = getChunkBounds({ x: chunk.chunkX, y: chunk.chunkY });
    const isBuildable = (tile: Point) =>
        isBuildableTerrain(getTerrainAtWorldPosition(chunk, tile.x, tile.y));
    const isFree = (tile: Point) =>
        isBuildable(tile) &&
        getEntitiesAt(chunkMap, tile.x, tile.y).every((occupant) => {
            const resource = occupant.getEcsComponent(ResourceComponentId);
            return resource && isDecorativeResource(resource.resourceId);
        });
    const footprintFits =
        (tileAccepts: (tile: Point) => boolean) => (anchor: Point) =>
            footprint.every((offset) => {
                const tile = addPoint(anchor, offset);
                return (
                    tile.x >= bounds.x1 &&
                    tile.x <= bounds.x2 &&
                    tile.y >= bounds.y1 &&
                    tile.y <= bounds.y2 &&
                    tileAccepts(tile)
                );
            });

    const preferredAnchor = {
        x: bounds.x1 + campAnchor.x,
        y: bounds.y1 + campAnchor.y,
    };
    // The radius is required: without it the search never terminates when
    // every candidate is rejected. ChunkSize * 2 covers the chunk from any
    // anchor with margin.
    const searchRadius = ChunkSize * 2;
    let campPosition = findClosestAvailablePosition(
        root,
        preferredAnchor,
        footprintFits(isFree),
        searchRadius,
    );
    if (!campPosition) {
        campPosition = findClosestAvailablePosition(
            root,
            preferredAnchor,
            footprintFits(isBuildable),
            searchRadius,
        );
        if (!campPosition) {
            log.warn("No buildable room for a goblin camp, skipping chunk", {
                chunkX: chunk.chunkX,
                chunkY: chunk.chunkY,
            });
            return;
        }
        clearOccupants(chunkMap, campPosition, footprint);
    }

    for (const offset of footprint) {
        clearDecorativeResourcesAt(root, addPoint(campPosition, offset));
    }

    chunkEntity.setEcsComponent(createKingdomComponent(KingdomType.Goblin));
    chunkEntity.addChild(camp);
    camp.position = {
        x: campPosition.x - bounds.x1,
        y: campPosition.y - bounds.y1,
    };
}

function clearOccupants(chunkMap: ChunkMap, anchor: Point, footprint: Point[]) {
    for (const offset of footprint) {
        const tile = addPoint(anchor, offset);
        for (const occupant of getEntitiesAt(chunkMap, tile.x, tile.y)) {
            log.warn("No free tiles for goblin camp, removing occupant", {
                entity: occupant.id,
                tile,
            });
            occupant.remove();
        }
    }
}

/**
 * Places a goblin settlement in the chunk if the world holds no goblin camp,
 * keeping a single camp alive in the world: when a cleared camp is removed,
 * the next chunk discovered outside the start biome hosts a new one.
 *
 * TODO: Replace with kingdom spawn evaluation. evaluateKingdomSpawn should
 * run once per volume on the first chunk discovered in that volume. For now,
 * keep the existing single goblin camp placement.
 */
export function placeSettlementIfNoneExists(
    rootEntity: Entity,
    chunk: GeneratedTileChunk,
    chunkEntity: Entity,
) {
    const goblinCamps = rootEntity.queryComponents(GoblinCampComponentId);
    if (goblinCamps.size > 0 || chunk.volume.isStartBiome) {
        return;
    }

    placeSettlement(chunk, chunkEntity);
}
