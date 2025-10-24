import { encodePosition } from "../../common/point.js";
import { SparseSet } from "../../common/structure/sparseSet.js";
import type { EcsSystem } from "../../common/ecs/ecsSystem.js";
import { ChunkSize } from "../map/chunk.js";
import {
    ChunkMapRegistryComponentId,
    createChunkMapRegistryComponent,
    getChunkMap,
    type ChunkMap,
    createChunkMap,
} from "../component/chunkMapRegistryComponent.js";
import type { Entity } from "../entity/entity.js";
import type {
    EntityChildrenUpdatedEvent,
    EntityTransformEvent,
} from "../entity/entityEvent.js";
import { getOverworldEntity } from "../map/scenes.js";
import { SpaceComponentId } from "../component/spaceComponent.js";

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
 * @param root the root entity of the system
 */
function init(root: Entity) {
    getOverworldEntity(root).setEcsComponent(createChunkMapRegistryComponent());
}

/**
 * Update the position of an entity in the chunkmap on each transform event
 * @param rootEntity the root entity of the system
 * @param entityEvent the event that occured
 */
function onTransform(_rootEntity: Entity, entityEvent: EntityTransformEvent) {
    const registry = entityEvent.source.requireAncestorEcsComponent(
        ChunkMapRegistryComponentId,
    );
    const spaceEntity = entityEvent.source.getAncestorEntity(SpaceComponentId);
    if (!spaceEntity) {
        console.warn(
            `[ChunkMapSystem] Entity ${entityEvent.source.id} has no space ancestor, cannot update chunk map`,
        );
        return;
    }

    const chunkMap = getChunkMap(registry, spaceEntity.id);
    if (!chunkMap) {
        // Create chunk map if it doesn't exist
        console.log(
            `[ChunkMapSystem] Creating new chunk map for space ${spaceEntity.id}`,
        );
        registry.chunkMaps.set(spaceEntity.id, createChunkMap());
        const newMap = getChunkMap(registry, spaceEntity.id)!;
        addToChunkmap(newMap, entityEvent.source);
        return;
    }

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
 * Add an entity to the chunkmap if it is added to the scene
 * @param rootEntity the root of the system
 * @param scopedEntity the entity that is the current scope of the ecs
 * @param entityEvent the event that happened
 */
function onEntityAdded(
    _rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const registry = entityEvent.target.requireAncestorEcsComponent(
        ChunkMapRegistryComponentId,
    );
    const spaceEntity = entityEvent.target.getAncestorEntity(SpaceComponentId);
    if (!spaceEntity) {
        console.warn(
            `[ChunkMapSystem] Entity ${entityEvent.target.id} has no space ancestor, cannot add to chunk map`,
        );
        return;
    }

    let chunkMap = getChunkMap(registry, spaceEntity.id);
    if (!chunkMap) {
        // Create chunk map if it doesn't exist
        console.log(
            `[ChunkMapSystem] Creating new chunk map for space ${spaceEntity.id}`,
        );
        registry.chunkMaps.set(spaceEntity.id, createChunkMap());
        chunkMap = getChunkMap(registry, spaceEntity.id)!;
    }

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
 * Remove an entity from the chunkmap when removed from the scene
 * @param rootEntity the root of the system
 * @param entityEvent the event that happened
 */
function onEntityRemoved(
    _rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const registry = entityEvent.target.requireAncestorEcsComponent(
        ChunkMapRegistryComponentId,
    );
    const spaceEntity = entityEvent.target.getAncestorEntity(SpaceComponentId);
    if (!spaceEntity) {
        console.warn(
            `[ChunkMapSystem] Entity ${entityEvent.target.id} has no space ancestor, cannot remove from chunk map`,
        );
        return;
    }

    const chunkMap = getChunkMap(registry, spaceEntity.id);
    if (!chunkMap) {
        console.warn(
            `[ChunkMapSystem] No chunk map found for space ${spaceEntity.id}, cannot remove entity`,
        );
        return;
    }

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
