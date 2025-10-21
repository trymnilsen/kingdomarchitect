import type { EcsSystem } from "../../common/ecs/ecsSystem.js";
import { createLazyGraphFromRootNode } from "../map/path/graph/generateGraph.js";
import { PathCache } from "../map/path/pathCache.js";
import {
    createPathfindingGraphComponent,
    PathfindingGraphComponent,
    PathfindingGraphComponentId,
} from "../component/pathfindingGraphComponent.js";
import type { Entity } from "../entity/entity.js";
import type {
    EntityChildrenUpdatedEvent,
    EntityTransformEvent,
} from "../entity/entityEvent.js";
import { getOverworldEntity } from "../map/scenes.js";

export const pathfindingSystem: EcsSystem = {
    onInit: init,
    onEntityEvent: {
        child_added: onEntityAdded,
        child_removed: onEntityRemoved,
        transform: onTransform,
    },
};

function init(root: Entity) {
    const overworld = getOverworldEntity(root);
    overworld.setEcsComponent(
        createPathfindingGraphComponent(createLazyGraphFromRootNode(overworld)),
    );
}

function onTransform(_rootEntity: Entity, entityEvent: EntityTransformEvent) {
    const graphComponent = entityEvent.source.requireAncestorEcsComponent(
        PathfindingGraphComponentId,
    );

    graphComponent.graph?.invalidatePoint(entityEvent.source.worldPosition);
}

function onEntityAdded(
    _rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const graphComponent = entityEvent.target.requireAncestorEcsComponent(
        PathfindingGraphComponentId,
    );

    graphComponent.graph?.invalidatePoint(entityEvent.target.worldPosition);
}

function onEntityRemoved(
    _rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const graphComponent = entityEvent.target.requireAncestorEcsComponent(
        PathfindingGraphComponentId,
    );
    graphComponent.graph?.invalidatePoint(entityEvent.target.worldPosition);
}
