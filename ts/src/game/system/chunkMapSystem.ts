import { encodePosition } from "../../common/point.ts";
import { SparseSet } from "../../common/structure/sparseSet.ts";
import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import { ChunkSize } from "../map/chunk.ts";
import {
    ChunkMapComponentId,
    type ChunkMap,
} from "../component/chunkMapComponent.ts";
import { SpriteComponentId } from "../component/spriteComponent.ts";
import type { Entity } from "../entity/entity.ts";
import type {
    EntityChildrenUpdatedEvent,
    EntityTransformEvent,
} from "../entity/entityEvent.ts";

/**
 * Only entities with a sprite have a physical presence in the world
 * and should be spatially indexed.
 */
function hasSpatialPresence(entity: Entity): boolean {
    return entity.hasComponent(SpriteComponentId);
}

/**
 * Keeps the ChunkMap spatial index in step with the entity tree. Entities are
 * indexed by world position no matter how deep they sit, so a goblin inside a
 * camp is found by a query over the tiles it stands on.
 *
 * The index is event-driven: it updates on add, remove and transform rather
 * than being rebuilt on a tick.
 */
export const chunkMapSystem: EcsSystem = {
    onEntityEvent: {
        child_added: onEntityAdded,
        child_removed: onEntityRemoved,
        transform: onTransform,
    },
};

/**
 * A moving parent drags its children's world positions with it, so a transform
 * re-indexes the whole subtree.
 */
function onTransform(rootEntity: Entity, entityEvent: EntityTransformEvent) {
    const chunkMap =
        rootEntity.requireEcsComponent(ChunkMapComponentId).chunkMap;
    updateEntityHierarchyInMap(chunkMap, entityEvent.source);
}

function updateEntityHierarchyInMap(chunkMap: ChunkMap, entity: Entity) {
    if (hasSpatialPresence(entity)) {
        const currentChunkKey = chunkMap.entityChunkMap.get(entity.id);
        const chunkX = Math.floor(entity.worldPosition.x / ChunkSize);
        const chunkY = Math.floor(entity.worldPosition.y / ChunkSize);
        const newChunkKey = encodePosition(chunkX, chunkY);

        // Most steps stay inside the same chunk, so only a crossing touches the map.
        if (currentChunkKey !== newChunkKey) {
            if (currentChunkKey !== undefined) {
                chunkMap.chunks.get(currentChunkKey)?.delete(entity);
            }

            chunkMap.entityChunkMap.set(entity.id, newChunkKey);
            getOrCreateChunk(chunkMap, newChunkKey).add(entity);
        }
    }

    for (const child of entity.children) {
        updateEntityHierarchyInMap(chunkMap, child);
    }
}

/**
 * Indexes the added entity and its subtree, so a parent attached with children
 * already on it (a camp with its goblins) registers all of them.
 */
function onEntityAdded(
    rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const chunkMap =
        rootEntity.requireEcsComponent(ChunkMapComponentId).chunkMap;
    addToChunkmap(chunkMap, entityEvent.target);
}

function addToChunkmap(chunkMap: ChunkMap, entity: Entity) {
    if (hasSpatialPresence(entity)) {
        const chunkX = Math.floor(entity.worldPosition.x / ChunkSize);
        const chunkY = Math.floor(entity.worldPosition.y / ChunkSize);
        const chunkKey = encodePosition(chunkX, chunkY);

        chunkMap.entityChunkMap.set(entity.id, chunkKey);
        getOrCreateChunk(chunkMap, chunkKey).add(entity);
    }

    for (const child of entity.children) {
        addToChunkmap(chunkMap, child);
    }
}

/**
 * Removes the entity and its subtree, so a removed parent leaves no children
 * behind in the index.
 */
function onEntityRemoved(
    rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const chunkMap =
        rootEntity.requireEcsComponent(ChunkMapComponentId).chunkMap;
    removeFromChunkmap(chunkMap, entityEvent.target);
}

function removeFromChunkmap(chunkMap: ChunkMap, entity: Entity) {
    if (hasSpatialPresence(entity)) {
        const chunkKey = chunkMap.entityChunkMap.get(entity.id);
        if (chunkKey !== undefined) {
            chunkMap.chunks.get(chunkKey)?.delete(entity);
            chunkMap.entityChunkMap.delete(entity.id);
        }
    }

    for (const child of entity.children) {
        removeFromChunkmap(chunkMap, child);
    }
}

function getOrCreateChunk(
    chunkMap: ChunkMap,
    chunkKey: number,
): SparseSet<Entity> {
    const chunk = chunkMap.chunks.get(chunkKey);
    if (chunk) {
        return chunk;
    }
    const set = new SparseSet<Entity>();
    chunkMap.chunks.set(chunkKey, set);
    return set;
}
