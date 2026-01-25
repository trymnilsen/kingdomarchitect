import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { PathfindingGraphComponentId } from "../component/pathfindingGraphComponent.ts";
import type { Entity } from "../entity/entity.ts";
import type {
    EntityChildrenUpdatedEvent,
    EntityTransformEvent,
} from "../entity/entityEvent.ts";

export const pathfindingSystem: EcsSystem = {
    onInit: init,
    onEntityEvent: {
        child_added: onEntityAdded,
        child_removed: onEntityRemoved,
        transform: onTransform,
    },
};

function init(_root: Entity) {
    // PathfindingGraph already exists from root factory, nothing to do
}

function onTransform(rootEntity: Entity, entityEvent: EntityTransformEvent) {
    const pathfindingGraphComponent = rootEntity.requireEcsComponent(
        PathfindingGraphComponentId,
    );

    pathfindingGraphComponent.pathfindingGraph.graph.invalidatePoint(
        entityEvent.oldPosition,
    );
    pathfindingGraphComponent.pathfindingGraph.graph.invalidatePoint(
        entityEvent.source.worldPosition,
    );
}

function onEntityAdded(
    _rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const pathfindingGraphComponent =
        entityEvent.target.requireAncestorEcsComponent(
            PathfindingGraphComponentId,
        );
    pathfindingGraphComponent.pathfindingGraph.graph.invalidatePoint(
        entityEvent.target.worldPosition,
    );
}

function onEntityRemoved(
    _rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const pathfindingGraphComponent =
        entityEvent.target.getAncestorEcsComponent(PathfindingGraphComponentId);
    if (!pathfindingGraphComponent) {
        // No graph exists, nothing to invalidate
        console.debug(
            `[PathfindingSystem] Entity ${entityEvent.target.id} has no graph, ignoring remove`,
        );
        return;
    }

    pathfindingGraphComponent.pathfindingGraph.graph.invalidatePoint(
        entityEvent.target.worldPosition,
    );
}
