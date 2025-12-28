import type { EcsSystem } from "../../common/ecs/ecsSystem.js";
import {
    createPathfindingGraph,
    createPathfindingGraphRegistryComponent,
    getPathfindingGraph,
    PathfindingGraphRegistryComponentId,
} from "../component/pathfindingGraphRegistryComponent.js";
import { SpaceComponentId } from "../component/spaceComponent.js";
import type { Entity } from "../entity/entity.js";
import type {
    EntityChildrenUpdatedEvent,
    EntityTransformEvent,
} from "../entity/entityEvent.js";
import { createLazyGraphFromRootNode } from "../map/path/graph/generateGraph.js";
import { getOverworldEntity } from "../map/scenes.js";

export const pathfindingSystem: EcsSystem = {
    onInit: init,
    onEntityEvent: {
        child_added: onEntityAdded,
        child_removed: onEntityRemoved,
        transform: onTransform,
    },
};

function init(_root: Entity) {
    // Registry already exists from root factory, nothing to do
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

    const pathfindingGraph = getOrCreatePathfindingGraph(registry, spaceEntity);
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

    const pathfindingGraph = getOrCreatePathfindingGraph(registry, spaceEntity);
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

    // Don't create a graph for removal - just get if it exists
    const pathfindingGraph = getPathfindingGraph(registry, spaceEntity.id);
    if (!pathfindingGraph) {
        // No graph exists, nothing to invalidate
        console.debug(
            `[PathfindingSystem] Entity ${entityEvent.target.id} has no graph, ignoring remove`,
        );
        return;
    }

    pathfindingGraph.graph?.invalidatePoint(entityEvent.target.worldPosition);
}

/**
 * Gets or creates a pathfinding graph for a space entity
 * @param registry The pathfinding graph registry
 * @param spaceEntity The space entity to get/create a graph for
 * @returns The pathfinding graph for the space
 */
function getOrCreatePathfindingGraph(
    registry: ReturnType<typeof createPathfindingGraphRegistryComponent>,
    spaceEntity: Entity,
) {
    let pathfindingGraph = getPathfindingGraph(registry, spaceEntity.id);
    if (!pathfindingGraph) {
        // Create pathfinding graph if it doesn't exist
        console.log(
            `[PathfindingSystem] Creating new pathfinding graph for space ${spaceEntity.id}`,
        );
        const graph = createLazyGraphFromRootNode(spaceEntity);
        pathfindingGraph = createPathfindingGraph(graph);
        registry.graphs.set(spaceEntity.id, pathfindingGraph);
    }
    return pathfindingGraph;
}
