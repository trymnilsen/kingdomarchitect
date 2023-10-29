import { generateId } from "../../../../src/common/idGenerator.js";
import { MovementComponent } from "../../../../src/game/component/movement/movementComponent.js";
import { ChunkMapComponent } from "../../../../src/game/component/root/chunk/chunkMapComponent.js";
import { PathFindingComponent } from "../../../../src/game/component/root/path/pathFindingComponent.js";
import { TilesComponent } from "../../../../src/game/component/tile/tilesComponent.js";
import { Entity } from "../../../../src/game/entity/entity.js";
import { createEmptyGraph } from "../../../path/testGraph.js";
import { MovementComponentWrapper } from "./movementComponentWrapper.js";

/**
 * Create a root-node for a test with all components needed
 * @returns the root node for the world we can use in the test
 */
export function createTestRootNode(
    width: number = 8,
    height: number = 8,
): Entity {
    // Create entity
    const entity = new Entity("rootNode");
    entity.toggleIsGameRoot(true);
    // Set the grid of tiles
    const tilesComponent = new TilesComponent();
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            tilesComponent.setTile({ tileX: x, tileY: y });
        }
    }
    entity.addComponent(tilesComponent);
    // Add the last dependencies
    const chunkComponent = new ChunkMapComponent();
    entity.addComponent(chunkComponent);
    entity.addComponent(new PathFindingComponent());

    return entity;
}

/**
 * Add an actor with all the components needed to the test world
 * @param rootNode n
 * @returns the movement component on the actor that was created
 */
export function addMovementActor(rootNode: Entity): MovementComponentWrapper {
    const actor = new Entity(generateId("actor"));
    const movementComponent = new MovementComponent();
    actor.addComponent(movementComponent);
    rootNode.addChild(actor);
    const wrapper = new MovementComponentWrapper(movementComponent);
    return wrapper;
}
