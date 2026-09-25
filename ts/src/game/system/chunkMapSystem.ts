import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import {
    ChunkMapComponentId,
    indexEntity,
    moveIndexedEntity,
    unindexEntity,
    type ChunkMap,
} from "../component/chunkMapComponent.ts";
import { SpriteComponentId } from "../component/spriteComponent.ts";
import type { Entity } from "../entity/entity.ts";
import type {
    ComponentsUpdatedEvent,
    EntityChildrenUpdatedEvent,
    EntityTransformEvent,
} from "../entity/entityEvent.ts";

export const chunkMapSystem: EcsSystem = {
    onEntityEvent: {
        child_added: onEntityAdded,
        child_removed: onEntityRemoved,
        transform: onTransform,
    },
    onComponent: {
        updated: { [SpriteComponentId]: onSpriteSet },
        removed: { [SpriteComponentId]: onSpriteRemoved },
    },
};

/**
 * Only entities with a sprite have a physical presence in the world
 * and should be spatially indexed.
 */
function hasSpatialPresence(entity: Entity): boolean {
    return entity.hasComponent(SpriteComponentId);
}

/**
 * A moving parent drags its children's world positions with it, so a transform
 * re-indexes the whole subtree.
 */
function onTransform(rootEntity: Entity, entityEvent: EntityTransformEvent) {
    const chunkMap =
        rootEntity.requireEcsComponent(ChunkMapComponentId).chunkMap;
    const source = entityEvent.source;
    const offsetX = source.worldPosition.x - entityEvent.oldPosition.x;
    const offsetY = source.worldPosition.y - entityEvent.oldPosition.y;
    moveHierarchy(chunkMap, source, offsetX, offsetY);
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
    indexHierarchy(chunkMap, entityEvent.target);
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
    unindexHierarchy(chunkMap, entityEvent.target);
}

function onSpriteSet(
    rootEntity: Entity,
    event: ComponentsUpdatedEvent<typeof SpriteComponentId>,
) {
    const chunkMap =
        rootEntity.requireEcsComponent(ChunkMapComponentId).chunkMap;
    indexEntity(chunkMap, event.source);
}

function onSpriteRemoved(
    rootEntity: Entity,
    event: ComponentsUpdatedEvent<typeof SpriteComponentId>,
) {
    const chunkMap =
        rootEntity.requireEcsComponent(ChunkMapComponentId).chunkMap;
    unindexEntity(chunkMap, event.source);
}

function indexHierarchy(chunkMap: ChunkMap, entity: Entity) {
    if (hasSpatialPresence(entity)) {
        indexEntity(chunkMap, entity);
    }
    for (const child of entity.children) {
        indexHierarchy(chunkMap, child);
    }
}

function moveHierarchy(
    chunkMap: ChunkMap,
    entity: Entity,
    offsetX: number,
    offsetY: number,
) {
    if (hasSpatialPresence(entity)) {
        moveIndexedEntity(
            chunkMap,
            entity,
            entity.worldPosition.x - offsetX,
            entity.worldPosition.y - offsetY,
        );
    }
    for (const child of entity.children) {
        moveHierarchy(chunkMap, child, offsetX, offsetY);
    }
}

function unindexHierarchy(chunkMap: ChunkMap, entity: Entity) {
    if (hasSpatialPresence(entity)) {
        unindexEntity(chunkMap, entity);
    }
    for (const child of entity.children) {
        unindexHierarchy(chunkMap, child);
    }
}
