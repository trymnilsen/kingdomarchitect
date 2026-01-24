import { Entity } from "./entity/entity.ts";
import { createChunkMapComponent } from "./component/chunkMapComponent.ts";
import { createPathfindingGraphComponent } from "./component/pathfindingGraphComponent.ts";
import { createLazyGraphFromRootNode } from "./map/path/graph/generateGraph.ts";

/**
 * Creates a root entity with all required components pre-initialized.
 * This ensures chunk map and pathfinding graph exist before any systems run init or entities are loaded.
 *
 * Use this factory in both client and server to ensure consistent setup.
 */
export function createRootEntity(): Entity {
    const root = new Entity("root");
    root.toggleIsGameRoot(true);

    // Set up chunk map and pathfinding graph components that must exist before any entity events
    root.setEcsComponent(createChunkMapComponent());

    // Create pathfinding graph for the root entity
    const graph = createLazyGraphFromRootNode(root);
    root.setEcsComponent(createPathfindingGraphComponent(graph));

    return root;
}
