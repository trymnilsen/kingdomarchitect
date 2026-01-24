import { encodePosition } from "../../common/point.ts";
import { SparseSet } from "../../common/structure/sparseSet.ts";
import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { ChunkSize } from "../map/chunk.ts";
import {
    ChunkMapComponentId,
    type ChunkMap,
} from "../component/chunkMapComponent.ts";
import type { Entity } from "../entity/entity.ts";
import type {
    EntityChildrenUpdatedEvent,
    EntityTransformEvent,
} from "../entity/entityEvent.ts";

export const chunkMapSystem: EcsSystem = {
    onInit: init,
    onEntityEvent: {
        child_added: onEntityAdded,
        child_removed: onEntityRemoved,
        transform: onTransform,
    },
};

/**
 * Run init actions
 * Chunk map already exists from root factory, nothing to do.
 * @param root the root entity of the system
 */
function init(_root: Entity) {
    // ChunkMap already exists from root factory, nothing to do
}

/**
 * Update the position of an entity in the chunkmap on each transform event
 * @param rootEntity the root entity of the system
 * @param entityEvent the event that occured
 */
function onTransform(_rootEntity: Entity, entityEvent: EntityTransformEvent) {
    const chunkMapComponent = entityEvent.source.requireAncestorEcsComponent(
        ChunkMapComponentId,
    );
    const chunkMap = chunkMapComponent.chunkMap;

    const currentChunkId = chunkMap.entityChunkMap.get(entityEvent.source.id);
    if (currentChunkId === undefined) {
        addToChunkmap(chunkMap, entityEvent.source);
        return;
    }

    const chunkX = Math.floor(entityEvent.source.worldPosition.x / ChunkSize);
    const chunkY = Math.floor(entityEvent.source.worldPosition.y / ChunkSize);
    const newChunkKey = encodePosition(chunkX, chunkY);
    if (currentChunkId === newChunkKey) {
        return;
    }
    const currentChunk = getOrCreateChunk(chunkMap, currentChunkId);
    currentChunk.delete(entityEvent.source);

    chunkMap.entityChunkMap.set(entityEvent.source.id, newChunkKey);
    const newChunk = getOrCreateChunk(chunkMap, newChunkKey);
    newChunk.add(entityEvent.source);
}

/**
 * Add an entity to the chunkmap when it is added
 * @param rootEntity the root of the system
 * @param entityEvent the event that happened
 */
function onEntityAdded(
    _rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const chunkMapComponent = entityEvent.target.requireAncestorEcsComponent(
        ChunkMapComponentId,
    );
    const chunkMap = chunkMapComponent.chunkMap;
    addToChunkmap(chunkMap, entityEvent.target);
}

function addToChunkmap(chunkMap: ChunkMap, entity: Entity) {
    // Convert to chunk coordinates
    const chunkX = Math.floor(entity.worldPosition.x / ChunkSize);
    const chunkY = Math.floor(entity.worldPosition.y / ChunkSize);
    const chunkKey = encodePosition(chunkX, chunkY);
    const chunk = getOrCreateChunk(chunkMap, chunkKey);
    chunkMap.entityChunkMap.set(entity.id, chunkKey);
    chunk.add(entity);
}

/**
 * Remove an entity from the chunkmap when removed
 * @param rootEntity the root of the system
 * @param entityEvent the event that happened
 */
function onEntityRemoved(
    _rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const chunkMapComponent = entityEvent.target.requireAncestorEcsComponent(
        ChunkMapComponentId,
    );
    const chunkMap = chunkMapComponent.chunkMap;

    const chunkForEntity = chunkMap.entityChunkMap.get(entityEvent.target.id);
    if (chunkForEntity === undefined) {
        return;
    }

    const chunk = chunkMap.chunks.get(chunkForEntity);
    if (chunk === undefined) {
        return;
    }

    chunk.delete(entityEvent.target);
    chunkMap.entityChunkMap.delete(entityEvent.target.id);
}

function getOrCreateChunk(
    chunkMap: ChunkMap,
    chunkKey: number,
): SparseSet<Entity> {
    const chunk = chunkMap.chunks.get(chunkKey);
    if (!!chunk) {
        return chunk;
    } else {
        const set = new SparseSet<Entity>();
        chunkMap.chunks.set(chunkKey, set);
        return set;
    }
}
