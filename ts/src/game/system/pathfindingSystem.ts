import type { EcsSystem } from "../../module/ecs/ecsSystem.js";
import { createLazyGraphFromRootNode } from "../../module/path/graph/generateGraph.js";
import { LazyGraph } from "../../module/path/graph/lazyGraph.js";
import { PathCache } from "../../module/path/pathCache.js";
import {
    PathfindingGraphComponent,
    PathfindingGraphComponentId,
} from "../component/pathfindingGraphComponent.js";
import type { Entity } from "../entity/entity.js";
import type {
    EntityChildrenUpdatedEvent,
    EntityTransformEvent,
} from "../entity/entityEvent.js";

export const pathfindingSystem: EcsSystem = {
    onInit: init,
    onEntityEvent: {
        child_added: onEntityAdded,
        child_removed: onEntityRemoved,
        transform: onTransform,
    },
};

function init(root: Entity) {
    const component: PathfindingGraphComponent = {
        id: PathfindingGraphComponentId,
        pathCache: new PathCache(),
        graph: createLazyGraphFromRootNode(root),
    };

    root.setEcsComponent(component);
}

function onTransform(rootEntity: Entity, entityEvent: EntityTransformEvent) {
    const graphComponent = rootEntity.requireEcsComponent(
        PathfindingGraphComponentId,
    );

    graphComponent.graph?.invalidatePoint(entityEvent.source.worldPosition);
}

function onEntityAdded(
    rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const graphComponent = rootEntity.requireEcsComponent(
        PathfindingGraphComponentId,
    );

    graphComponent.graph?.invalidatePoint(entityEvent.target.worldPosition);
}

function onEntityRemoved(
    rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const graphComponent = rootEntity.requireEcsComponent(
        PathfindingGraphComponentId,
    );
    graphComponent.graph?.invalidatePoint(entityEvent.target.worldPosition);
}
