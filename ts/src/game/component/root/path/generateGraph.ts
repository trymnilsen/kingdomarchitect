import { absBounds } from "../../../../common/bounds.js";
import { InvalidArgumentError } from "../../../../common/error/invalidArgumentError.js";
import { Point } from "../../../../common/point.js";
import {
    FixedGraph,
    WeightFunction,
} from "../../../../path/graph/fixedGraph.js";
import { Graph } from "../../../../path/graph/graph.js";
import { LazyGraph } from "../../../../path/graph/lazyGraph.js";
import { Entity } from "../../../entity/entity.js";
import { WorkerBehaviorComponent } from "../../behavior/workerBehaviorComponent.js";
import { BuildingComponent } from "../../building/buildingComponent.js";
import { TilesComponent } from "../../tile/tilesComponent.js";
import { ChunkMapComponent } from "../chunk/chunkMapComponent.js";

/**
 * Creates a graph based on the given world
 * @param rootEntity
 * @returns a [Graph] based on the entities in the world for pathfinding
 */
export function createGraphFromNodes(rootEntity: Entity): FixedGraph {
    const weightFunction: WeightFunction = () => {
        const groundComponent = rootEntity.getComponent(TilesComponent);
        if (!groundComponent) {
            throw new InvalidArgumentError(
                "Root entity needs a tiles component"
            );
        }

        const bounds = groundComponent.getBounds();

        const offsetBounds = absBounds(bounds);
        const weightGraph: number[][] = [];
        for (let x = 0; x <= offsetBounds.bounds.x2; x++) {
            weightGraph[x] = [];
            for (let y = 0; y <= offsetBounds.bounds.y2; y++) {
                const tilePositionXWithoutOffset = x - offsetBounds.offsets.x;
                const tilePositionYWithoutOffset = y - offsetBounds.offsets.y;

                weightGraph[x][y] = getWeightAtPoint(
                    {
                        x: tilePositionXWithoutOffset,
                        y: tilePositionYWithoutOffset,
                    },
                    rootEntity,
                    groundComponent
                );
            }
        }

        return {
            weights: weightGraph,
            offsetX: offsetBounds.offsets.x,
            offsetY: offsetBounds.offsets.y,
        };
    };

    const graph = new FixedGraph(weightFunction);
    return graph;
}

export function createLazyGraphFromRootNode(node: Entity): Graph {
    const groundComponent = node.getComponent(TilesComponent);
    if (!groundComponent) {
        throw new Error("No ground component on root node");
    }

    return new LazyGraph((point) => {
        return getWeightAtPoint(point, node, groundComponent);
    });
}

function getWeightAtPoint(
    point: Point,
    rootEntity: Entity,
    groundComponent: TilesComponent
): number {
    let weight = 1000;
    const ground = groundComponent.getTile({
        x: point.x,
        y: point.y,
    });
    if (ground) {
        if (ground.hasTree) {
            weight = 200;
        } else {
            weight = 5;
        }
    } else {
        console.log(`No ground at ${point.x}, ${point.y} setting to 0`);
        weight = 0;
    }

    const entities = rootEntity
        .requireComponent(ChunkMapComponent)
        .getEntityAt({
            x: point.x,
            y: point.y,
        });

    if (entities.length > 0) {
        let entityWeight = 0;
        for (const entity of entities) {
            const buildingComponent = entity.getComponent(BuildingComponent);

            if (!!buildingComponent) {
                entityWeight = 500;
            }

            const workerComponent = entity.getComponent(
                WorkerBehaviorComponent
            );

            if (!!workerComponent) {
                entityWeight = 500;
            }
        }

        if (entityWeight > 0) {
            weight = entityWeight;
        }
    }

    return weight;
}
