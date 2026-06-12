import type { Bounds } from "../../common/bounds.ts";
import { encodePosition, type Point } from "../../common/point.ts";
import { SparseSet } from "../../common/structure/sparseSet.ts";
import { ChunkSize } from "../map/chunk.ts";
import type { Entity } from "../entity/entity.ts";
import { visitChildren } from "../entity/child/visit.ts";
import type { ComponentID, Components } from "./component.ts";

export type ChunkMap = {
    chunks: Map<number, SparseSet<Entity>>;
    entityChunkMap: Map<string, number>;
};

export type ChunkMapComponent = {
    id: typeof ChunkMapComponentId;
    chunkMap: ChunkMap;
};

export const ChunkMapComponentId = "ChunkMap";

export function createChunkMapComponent(): ChunkMapComponent {
    return {
        id: ChunkMapComponentId,
        chunkMap: createChunkMap(),
    };
}

export function createChunkMap(): ChunkMap {
    return {
        chunks: new Map(),
        entityChunkMap: new Map(),
    };
}

/**
 * Gets all entities in the chunk at the given world position
 * @param chunkMap The ChunkMap to search in
 * @param x the x coordinate in tilespace
 * @param y the y coordinate in tilespace
 * @returns an array of entities within the chunk at the given position
 */
export function getEntitiesAt(
    chunkMap: ChunkMap,
    x: number,
    y: number,
): Entity[] {
    // Convert to chunk coordinates
    const chunkX = Math.floor(x / ChunkSize);
    const chunkY = Math.floor(y / ChunkSize);
    const chunkKey = encodePosition(chunkX, chunkY);

    const chunk = chunkMap.chunks.get(chunkKey);
    if (!chunk) {
        return [];
    }

    const entities: Entity[] = [];
    for (let i = 0; i < chunk.size; i++) {
        const entity = chunk.elementAt(i);
        const atPosition =
            entity.worldPosition.x === x && entity.worldPosition.y === y;
        if (atPosition) {
            entities.push(entity);
        }
    }

    return entities;
}

export function getEntitiesInChunkMapWithin(
    chunkMap: ChunkMap,
    bounds: Bounds,
): Entity[] {
    const startChunkX = Math.floor(bounds.x1 / ChunkSize);
    const startChunkY = Math.floor(bounds.y1 / ChunkSize);
    const endChunkX = Math.ceil(bounds.x2 / ChunkSize) + 1;
    const endChunkY = Math.ceil(bounds.y2 / ChunkSize) + 1;
    const xChunks = endChunkX - startChunkX;
    const yChunks = endChunkY - startChunkY;

    const entities: Entity[] = [];
    const totalChunks = xChunks * yChunks;

    for (let i = 0; i < totalChunks; i++) {
        // Convert the linear index `i` to chunk coordinates
        const chunkX = startChunkX + (i % xChunks);
        const chunkY = startChunkY + Math.floor(i / xChunks);
        const chunkKey = encodePosition(chunkX, chunkY);

        const chunk = chunkMap.chunks.get(chunkKey);
        if (!chunk || chunk.size === 0) continue;

        // Collect entities
        entities.push(...chunk.dense);
    }

    return entities;
}

/**
 * Visits every entity carrying `componentId` whose chunk overlaps `bounds`,
 * handing the entity and its (narrowed) component straight to the visitor. This
 * is the allocation-free spatial query the render pass uses: it walks each
 * overlapping chunk's dense array inline — no intermediate entity array, no
 * result map, no spread — so a per-frame pan does not churn collections.
 *
 * The cut is at chunk granularity ({@link ChunkSize} tiles) with a one-chunk
 * margin, matching {@link getEntitiesInChunkMapWithin}; there is intentionally no
 * exact per-entity bounds test, so an entity near the edge whose footprint or
 * sprite still reaches on-screen is included rather than popping out.
 *
 * Only sprite-bearing entities are spatially indexed, so callers must query a
 * component that co-occurs with a sprite. Roots without a chunk map (bare test
 * trees) fall back to a full {@link visitChildren} walk with the same filter.
 *
 * @param root world root holding the {@link ChunkMapComponent}
 * @param bounds the region to cover, in world tile coordinates
 * @param componentId the component every visited entity must carry
 * @param visitor called once per matching entity; must not mutate the tree
 */
export function forEachComponentWithin<ID extends ComponentID>(
    root: Entity,
    bounds: Bounds,
    componentId: ID,
    visitor: (entity: Entity, component: Extract<Components, { id: ID }>) => void,
): void {
    const chunkMapComponent = root.getEcsComponent(ChunkMapComponentId);
    if (!chunkMapComponent) {
        visitChildren(root, (entity) => {
            const component = entity.getEcsComponent(componentId);
            if (component) {
                visitor(entity, component);
            }
            return false;
        });
        return;
    }

    const chunks = chunkMapComponent.chunkMap.chunks;
    const startChunkX = Math.floor(bounds.x1 / ChunkSize);
    const startChunkY = Math.floor(bounds.y1 / ChunkSize);
    const endChunkX = Math.ceil(bounds.x2 / ChunkSize) + 1;
    const endChunkY = Math.ceil(bounds.y2 / ChunkSize) + 1;

    for (let chunkY = startChunkY; chunkY < endChunkY; chunkY++) {
        for (let chunkX = startChunkX; chunkX < endChunkX; chunkX++) {
            const chunk = chunks.get(encodePosition(chunkX, chunkY));
            if (!chunk || chunk.size === 0) {
                continue;
            }
            const dense = chunk.dense;
            for (let i = 0; i < dense.length; i++) {
                const entity = dense[i];
                const component = entity.getEcsComponent(componentId);
                if (component) {
                    visitor(entity, component);
                }
            }
        }
    }
}

export function getEntitiesInChunk(
    chunkMap: ChunkMap,
    chunkPosition: Point,
): Entity[] {
    const chunkKey = encodePosition(chunkPosition.x, chunkPosition.y);
    const chunk = chunkMap.chunks.get(chunkKey);
    if (!!chunk) {
        return chunk.dense;
    } else {
        return [];
    }
}
