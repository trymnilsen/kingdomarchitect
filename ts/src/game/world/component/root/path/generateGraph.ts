import { absBounds } from "../../../../../common/bounds";
import { InvalidArgumentError } from "../../../../../common/error/invalidArgumentError";
import {
    FixedGraph,
    WeightFunction,
} from "../../../../../path/graph/fixedGraph";

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
                let weight = 1000;
                const tilePositionXWithoutOffset = x - offsetBounds.offsets.x;
                const tilePositionYWithoutOffset = y - offsetBounds.offsets.y;

                const ground = groundComponent.getTile({
                    x: tilePositionXWithoutOffset,
                    y: tilePositionYWithoutOffset,
                });
                if (ground) {
                    if (ground.hasTree) {
                        weight = 20;
                    } else {
                        weight = 5;
                    }
                } else {
                    weight = 0;
                }

                const entities = rootEntity.getEntityAt({
                    x,
                    y,
                });

                if (entities.length > 0) {
                    let entityWeight = 0;
                    for (const entity of entities) {
                        const buildingComponent =
                            entity.getComponent(BuildingComponent);

                        if (!!buildingComponent) {
                            entityWeight = 100;
                        }

                        const workerComponent = entity.getComponent(
                            WorkerBehaviorComponent
                        );

                        if (!!workerComponent) {
                            entityWeight = 100;
                        }
                    }

                    if (entityWeight > 0) {
                        weight = entityWeight;
                    }
                }

                weightGraph[x][y] = weight;
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
