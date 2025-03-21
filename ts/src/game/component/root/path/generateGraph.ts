import { absBounds } from "../../../../common/bounds.js";
import { InvalidArgumentError } from "../../../../common/error/invalidArgumentError.js";
import {
    FixedGraph,
    WeightFunction,
} from "../../../../module/path/graph/fixedGraph.js";
import { Graph } from "../../../../module/path/graph/graph.js";
import { LazyGraph } from "../../../../module/path/graph/lazyGraph.js";
import { Entity } from "../../../entity/entity.js";
import { TilesComponent } from "../../tile/tilesComponent.js";
import { getWeightAtPoint } from "./weight.js";

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
                "Root entity needs a tiles component",
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
                    groundComponent,
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
