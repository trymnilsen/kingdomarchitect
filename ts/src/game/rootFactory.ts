import { Entity } from "./entity/entity.js";
import { createChunkMapRegistryComponent } from "./component/chunkMapRegistryComponent.js";
import { createPathfindingGraphRegistryComponent } from "./component/pathfindingGraphRegistryComponent.js";

/**
 * Creates a root entity with all required registry components pre-initialized.
 * This ensures registries exist before any systems run init or entities are loaded.
 *
 * Use this factory in both client and server to ensure consistent setup.
 */
export function createRootEntity(): Entity {
    const root = new Entity("root");
    root.toggleIsGameRoot(true);

    // Set up registry components that must exist before any entity events
    root.setEcsComponent(createChunkMapRegistryComponent());
    root.setEcsComponent(createPathfindingGraphRegistryComponent());

    return root;
}
