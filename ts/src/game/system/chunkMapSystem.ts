import type { EcsSystem } from "../../module/ecs/ecsSystem.js";
import { ChunkMapComponent } from "../component/chunkMapComponent.js";
import type { Entity } from "../entity/entity.js";
import type {
    ComponentsUpdatedEvent,
    EntityChildrenUpdatedEvent,
    EntityEvent,
    EntityTransformEvent,
} from "../entity/entityEvent.js";

export const chunkMapSystem: EcsSystem = {
    onInit: init,
    onEntityEvent: {
        child_added: onEntityAdded,
        child_removed: onEntityRemoved,
        transform: onTransform,
    },
};

function init(root: Entity) {
    root.addEcsComponent(new ChunkMapComponent());
}

function onTransform(rootEntity: Entity, entityEvent: EntityTransformEvent) {
    const chunkMap = rootEntity.requireEcsComponent(ChunkMapComponent);
    chunkMap.updateEntity(entityEvent.source);
}

function onEntityAdded(
    rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const chunkMap = rootEntity.requireEcsComponent(ChunkMapComponent);
    chunkMap.addEntity(entityEvent.target);
}

function onEntityRemoved(
    rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const chunkMap = rootEntity.requireEcsComponent(ChunkMapComponent);
    chunkMap.removeEntity(entityEvent.target);
}
