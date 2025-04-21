import type { EcsSystem } from "../../module/ecs/ecsSystem.js";
import { createLazyGraphFromRootNode } from "../../module/path/graph/generateGraph.js";
import { LazyGraph } from "../../module/path/graph/lazyGraph.js";
import { PathfindingGraphComponent } from "../component/pathfindingGraphComponent.js";
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
    const component = new PathfindingGraphComponent();
    component.graph = createLazyGraphFromRootNode(root);
    root.addEcsComponent(component);
}

function onTransform(rootEntity: Entity, entityEvent: EntityTransformEvent) {
    const graphComponent = rootEntity.requireEcsComponent(
        PathfindingGraphComponent,
    );
    graphComponent.graph?.invalidatePoint(entityEvent.source.worldPosition);
}

function onEntityAdded(
    rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const graphComponent = rootEntity.requireEcsComponent(
        PathfindingGraphComponent,
    );
    graphComponent.graph?.invalidatePoint(entityEvent.target.worldPosition);
}

function onEntityRemoved(
    rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const graphComponent = rootEntity.requireEcsComponent(
        PathfindingGraphComponent,
    );
    graphComponent.graph?.invalidatePoint(entityEvent.target.worldPosition);
}
