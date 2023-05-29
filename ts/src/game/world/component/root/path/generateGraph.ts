import { absBounds } from "../../../../../common/bounds";
import { InvalidArgumentError } from "../../../../../common/error/invalidArgumentError";
import { Point } from "../../../../../common/point";
import {
    FixedGraph,
    WeightFunction,
} from "../../../../../path/graph/fixedGraph";
import { Graph } from "../../../../../path/graph/graph";
import { LazyGraph } from "../../../../../path/graph/lazyGraph";

import { RootEntity } from "../../../entity/rootEntity";
import { WorkerBehaviorComponent } from "../../behavior/workerBehaviorComponent";
import { BuildingComponent } from "../../building/buildingComponent";
import { TilesComponent } from "../../tile/tilesComponent";

/**
 * Creates a graph based on the given world
 * @param rootEntity
 * @returns a [Graph] based on the entities in the world for pathfinding
 */
export function createGraphFromNodes(rootEntity: RootEntity): FixedGraph {
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

export function createLazyGraphFromRootNode(node: RootEntity): Graph {
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
    rootEntity: RootEntity,
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

    const entities = rootEntity.getEntityAt({
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
