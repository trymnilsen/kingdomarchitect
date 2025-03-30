import { randomColor } from "../../../../src/common/color.js";
import { Axis } from "../../../../src/common/direction.js";
import { generateId } from "../../../../src/common/idGenerator.js";
import { addPoint } from "../../../../src/common/point.js";
import { EnergyComponent } from "../../../../src/game/componentOld/energy/energyComponent.js";
import { MovementComponent } from "../../../../src/game/componentOld/movement/movementComponent.js";
import { PathFindingComponent } from "../../../../src/game/componentOld/root/path/pathFindingComponent.js";
import { TilesComponent } from "../../../../src/game/componentOld/tile/tilesComponent.js";
import { SpatialChunkMapComponent } from "../../../../src/game/componentOld/world/spatialChunkMapComponent.js";
import { Entity } from "../../../../src/game/entity/entity.js";
import { createEmptyGraph } from "../../../path/testGraph.js";
import { MovementComponentWrapper } from "./movementComponentWrapper.js";

/**
 * Create a root-node for a test with all components needed
 * @returns the root node for the world we can use in the test
 */
export function createTestRootNode(): Entity {
    // Create entity
    const entity = new Entity("rootNode");
    entity.toggleIsGameRoot(true);
    // Set the grid of tiles
    const tilesComponent = new TilesComponent();
    tilesComponent.setChunk({
        chunkX: 0,
        chunkY: 0,
        discovered: new Set(),
        volume: {
            id: "testvolume",
            type: "forrest",
            chunks: [{ x: 0, y: 0 }],
            maxSize: 4,
            size: 1,
            debugColor: randomColor(),
        },
    });

    entity.addComponent(tilesComponent);
    // Add the last dependencies
    const chunkComponent = new SpatialChunkMapComponent();
    entity.addComponent(chunkComponent);
    entity.addComponent(new PathFindingComponent());

    return entity;
}

/**
 * Add an actor with all the components needed to the test world.
 * Starts with 100 energy
 * @param rootNode node to add actor to
 * @returns the movement component on the actor that was created
 */
export function addMovementActor(rootNode: Entity): MovementComponentWrapper {
    const actor = new Entity(generateId("actor"));
    const movementComponent = new MovementComponent();
    const energyComponent = new EnergyComponent();
    energyComponent.setEnergy(100);
    actor.addComponent(energyComponent);
    actor.addComponent(movementComponent);
    rootNode.addChild(actor);
    const wrapper = new MovementComponentWrapper(
        movementComponent,
        energyComponent,
    );
    return wrapper;
}

/*
export function removeTile(rootNode: Entity, x: number, y: number) {
    const tiles = rootNode.requireComponent(TilesComponent);
    tiles.removeTile(x, y);
    rootNode
        .requireComponent(PathFindingComponent)
        .invalidateGraphPoint({ x, y });
}
*/

/*
export function removeTileLine(
    rootNode: Entity,
    x: number,
    y: number,
    axis: Axis,
    length: number,
) {
    const start = {
        x,
        y,
    };

    for (let i = 0; i < length; i++) {
        let point = start;
        if (axis == Axis.XAxis) {
            point = {
                x: start.x + i,
                y: start.y,
            };
        } else {
            point = {
                x: start.x,
                y: start.y + i,
            };
        }

        removeTile(rootNode, point.x, point.y);
    }
}
*/
