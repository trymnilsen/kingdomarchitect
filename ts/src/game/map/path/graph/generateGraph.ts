import { absBounds } from "../../../../common/bounds.js";
import { InvalidArgumentError } from "../../../../common/error/invalidArgumentError.js";
import {
    getBoundsForTiles,
    TileComponentId,
} from "../../../component/tileComponent.js";
import type { Entity } from "../../../entity/entity.js";
import { FixedGraph, WeightFunction } from "./fixedGraph.js";
import type { Graph } from "./graph.js";
import { LazyGraph } from "./lazyGraph.js";
import { getWeightAtPoint } from "./weight.js";

export function createGraphFromNodes(rootEntity: Entity): FixedGraph {
    const weightFunction: WeightFunction = () => {
        const groundComponent = rootEntity.getEcsComponent(TileComponentId);
        if (!groundComponent) {
            throw new InvalidArgumentError(
                "Root entity needs a tiles component",
            );
        }

        const bounds = getBoundsForTiles(groundComponent);

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
    return new LazyGraph((point) => {
        return getWeightAtPoint(point, node);
    });
}
