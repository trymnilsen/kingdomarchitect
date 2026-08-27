import { Entity, RootEntityId } from "./entity/entity.ts";
import { createChunkMapComponent } from "./component/chunkMapComponent.ts";
import { createPathfindingGraphComponent } from "./component/pathfindingGraphComponent.ts";
import { createLazyGraphFromRootNode } from "./map/path/graph/generateGraph.ts";
import { createTileComponent } from "./component/tileComponent.ts";
import { createDayComponent } from "./component/dayComponent.ts";

/**
 * Creates a root entity with its components already attached, so the chunk map
 * and pathfinding graph exist before any system initializes or any entity is
 * loaded. Client and server both build their root here.
 */
export function createRootEntity(): Entity {
    const root = new Entity(RootEntityId);
    root.toggleIsGameRoot(true);

    // Set up chunk map and pathfinding graph components that must exist before any entity events
    root.setEcsComponent(createChunkMapComponent());
    root.setEcsComponent(createTileComponent());
    root.setEcsComponent(createDayComponent());
    // Create pathfinding graph for the root entity
    const graph = createLazyGraphFromRootNode(root);
    root.setEcsComponent(createPathfindingGraphComponent(graph));

    return root;
}
