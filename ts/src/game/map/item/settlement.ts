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
    type TileChunk,
} from "../chunk.ts";

/**
 * The preferred camp anchor within a chunk, roughly its center.
 */
const campAnchor: Point = { x: 4, y: 3 };

/**
 * Places a goblin settlement in a chunk.
 * Creates a camp entity with an initial goblin.
 * The goblin must build their own fire and other structures.
 *
 * The camp searches for unoccupied tiles near the chunk center, so placement
 * is valid no matter what was generated in the chunk before it. In the
 * degenerate case where no free spot exists, the camp claims the center
 * tiles and removes whatever occupies them — a camp must always be placed,
 * the single-camp invariant and respawn flow depend on it.
 */
export function placeSettlement(chunk: TileChunk, chunkEntity: Entity) {
    chunkEntity.setEcsComponent(createKingdomComponent(KingdomType.Goblin));

    const { camp } = goblinCampPrefab();
    // The camp children (campfire and goblin) define the tiles the camp
    // needs, keeping the prefab the single source of truth for its layout.
    const footprint = camp.children.map((child) => child.position);

    const root = chunkEntity.getRootEntity();
    const chunkMap = root.requireEcsComponent(ChunkMapComponentId).chunkMap;
    const bounds = getChunkBounds({ x: chunk.chunkX, y: chunk.chunkY });
    // Decorative resources (grass) don't claim a tile — they are cleared
    // when the camp is placed on top of them.
    const isTileFree = (tile: Point) =>
        getEntitiesAt(chunkMap, tile.x, tile.y).every((occupant) => {
            const resource = occupant.getEcsComponent(ResourceComponentId);
            return resource && isDecorativeResource(resource.resourceId);
        });
    const isFootprintFree = (anchor: Point) =>
        footprint.every((offset) => {
            const tile = addPoint(anchor, offset);
            return (
                tile.x >= bounds.x1 &&
                tile.x <= bounds.x2 &&
                tile.y >= bounds.y1 &&
                tile.y <= bounds.y2 &&
                isTileFree(tile)
            );
        });

    const preferredAnchor = {
        x: bounds.x1 + campAnchor.x,
        y: bounds.y1 + campAnchor.y,
    };
    // The radius is required: without it the search never terminates when
    // every candidate is rejected. ChunkSize * 2 covers the chunk from any
    // anchor with margin.
    const anchor = findClosestAvailablePosition(
        root,
        preferredAnchor,
        isFootprintFree,
        ChunkSize * 2,
    );
    if (!anchor) {
        clearTiles(chunkMap, preferredAnchor, footprint);
    }
    const campPosition = anchor ?? preferredAnchor;

    for (const offset of footprint) {
        clearDecorativeResourcesAt(root, addPoint(campPosition, offset));
    }

    chunkEntity.addChild(camp);
    camp.position = {
        x: campPosition.x - bounds.x1,
        y: campPosition.y - bounds.y1,
    };
}

/**
 * Removes every entity occupying the given footprint, making room for a camp
 * in a chunk with no free tiles. Last resort for the unreachable-in-practice
 * case where the free-tile search fails.
 */
function clearTiles(chunkMap: ChunkMap, anchor: Point, footprint: Point[]) {
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
    chunk: Required<TileChunk>,
    chunkEntity: Entity,
) {
    const goblinCamps = rootEntity.queryComponents(GoblinCampComponentId);
    if (goblinCamps.size > 0 || chunk.volume.isStartBiome) {
        return;
    }

    placeSettlement(chunk, chunkEntity);
}
