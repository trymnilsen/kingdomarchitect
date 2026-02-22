import { encodePosition } from "../../common/point.ts";
import { SparseSet } from "../../common/structure/sparseSet.ts";
import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
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
 * System responsible for maintaining a spatial index (ChunkMap) of all entities.
 * It ensures that entities—including those nested deep within hierarchies (like Goblins
 * inside a Camp)—are indexed by their world position for fast spatial queries.
 */
export const chunkMapSystem: EcsSystem = {
    onInit: init,
    onEntityEvent: {
        child_added: onEntityAdded,
        child_removed: onEntityRemoved,
        transform: onTransform,
    },
};

/**
 * @param _root The root entity of the ECS world.
 */
function init(_root: Entity) {
    // Initialized via root factory
}

/**
 * Updates the spatial index when an entity moves.
 * * If a parent moves, this recursively updates all children since their
 * world positions are relative to the parent and will have changed.
 * @param rootEntity The world root containing the ChunkMapComponent.
 * @param entityEvent The transform event details.
 */
function onTransform(rootEntity: Entity, entityEvent: EntityTransformEvent) {
    const chunkMap =
        rootEntity.requireEcsComponent(ChunkMapComponentId).chunkMap;
    updateEntityHierarchyInMap(chunkMap, entityEvent.source);
}

/**
 * Recursively checks and updates chunk assignments for an entity branch.
 */
function updateEntityHierarchyInMap(chunkMap: ChunkMap, entity: Entity) {
    if (hasSpatialPresence(entity)) {
        const currentChunkKey = chunkMap.entityChunkMap.get(entity.id);
        const chunkX = Math.floor(entity.worldPosition.x / ChunkSize);
        const chunkY = Math.floor(entity.worldPosition.y / ChunkSize);
        const newChunkKey = encodePosition(chunkX, chunkY);

        // Boundary check optimization: only modify the map if the entity moved to a new chunk
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
 * Indexes an entity and its entire subtree when added to the world.
 * This ensures that if a parent (e.g., a building) is added with pre-existing
 * children (e.g., workers), every child is correctly registered in the spatial map.
 */
function onEntityAdded(
    rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const chunkMap =
        rootEntity.requireEcsComponent(ChunkMapComponentId).chunkMap;
    addToChunkmap(chunkMap, entityEvent.target);
}

/**
 * Adds an entity to the chunkmap, potentially doing it for all its children too
 */
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
 * Removes an entity and its entire subtree from the spatial index.
 * Prevents "ghost" entities by ensuring that when a parent is removed,
 * no dangling references to its children remain in the ChunkMap.
 */
function onEntityRemoved(
    rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const chunkMap =
        rootEntity.requireEcsComponent(ChunkMapComponentId).chunkMap;
    removeFromChunkmap(chunkMap, entityEvent.target);
}

/**
 * Removes an entity from the chunkmap, potentially also doing it for children
 */
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

/**
 * Retrieves an existing chunk or initializes a new SparseSet for the given key.
 * @param chunkMap The current spatial map.
 * @param chunkKey The encoded XY position of the chunk.
 * @returns A SparseSet of entities for that chunk.
 */
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
