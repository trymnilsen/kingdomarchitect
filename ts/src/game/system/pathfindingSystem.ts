import type { EcsSystem } from "../../common/ecs/ecsSystem.js";
import { createLazyGraphFromRootNode } from "../map/path/graph/generateGraph.js";
import {
    createPathfindingGraphRegistryComponent,
    PathfindingGraphRegistryComponentId,
    getPathfindingGraph,
    createPathfindingGraph,
} from "../component/pathfindingGraphRegistryComponent.js";
import type { Entity } from "../entity/entity.js";
import type {
    EntityChildrenUpdatedEvent,
    EntityTransformEvent,
} from "../entity/entityEvent.js";
import { getOverworldEntity } from "../map/scenes.js";
import { SpaceComponentId } from "../component/spaceComponent.js";

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
    const registry = createPathfindingGraphRegistryComponent();
    // Create pathfinding graph for the overworld
    const overworldGraph = createPathfindingGraph(
        createLazyGraphFromRootNode(overworld),
    );
    registry.graphs.set(overworld.id, overworldGraph);
    overworld.setEcsComponent(registry);
}

function onTransform(_rootEntity: Entity, entityEvent: EntityTransformEvent) {
    const registry = entityEvent.source.requireAncestorEcsComponent(
        PathfindingGraphRegistryComponentId,
    );
    const spaceEntity = entityEvent.source.getAncestorEntity(SpaceComponentId);
    if (!spaceEntity) {
        console.warn(
            `[PathfindingSystem] Entity ${entityEvent.source.id} has no space ancestor, cannot invalidate pathfinding graph`,
        );
        return;
    }

    const pathfindingGraph = getPathfindingGraph(registry, spaceEntity.id);
    if (!pathfindingGraph) {
        console.warn(
            `[PathfindingSystem] No pathfinding graph found for space ${spaceEntity.id}`,
        );
        return;
    }

    pathfindingGraph.graph?.invalidatePoint(entityEvent.source.worldPosition);
}

function onEntityAdded(
    _rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const registry = entityEvent.target.requireAncestorEcsComponent(
        PathfindingGraphRegistryComponentId,
    );
    const spaceEntity = entityEvent.target.getAncestorEntity(SpaceComponentId);
    if (!spaceEntity) {
        console.warn(
            `[PathfindingSystem] Entity ${entityEvent.target.id} has no space ancestor, cannot invalidate pathfinding graph`,
        );
        return;
    }

    const pathfindingGraph = getPathfindingGraph(registry, spaceEntity.id);
    if (!pathfindingGraph) {
        console.warn(
            `[PathfindingSystem] No pathfinding graph found for space ${spaceEntity.id}`,
        );
        return;
    }

    pathfindingGraph.graph?.invalidatePoint(entityEvent.target.worldPosition);
}

function onEntityRemoved(
    _rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const registry = entityEvent.target.requireAncestorEcsComponent(
        PathfindingGraphRegistryComponentId,
    );
    const spaceEntity = entityEvent.target.getAncestorEntity(SpaceComponentId);
    if (!spaceEntity) {
        console.warn(
            `[PathfindingSystem] Entity ${entityEvent.target.id} has no space ancestor, cannot invalidate pathfinding graph`,
        );
        return;
    }

    const pathfindingGraph = getPathfindingGraph(registry, spaceEntity.id);
    if (!pathfindingGraph) {
        console.warn(
            `[PathfindingSystem] No pathfinding graph found for space ${spaceEntity.id}`,
        );
        return;
    }

    pathfindingGraph.graph?.invalidatePoint(entityEvent.target.worldPosition);
}
