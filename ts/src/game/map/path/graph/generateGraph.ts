import { absBounds } from "../../../../common/bounds.ts";
import { InvalidArgumentError } from "../../../../common/error/invalidArgumentError.ts";
import {
    getBoundsForTiles,
    TileComponentId,
} from "../../../component/tileComponent.ts";
import type { Entity } from "../../../entity/entity.ts";
import { FixedGraph, WeightFunction } from "./fixedGraph.ts";
import type { Graph } from "./graph.ts";
import { LazyGraph } from "./lazyGraph.ts";
import { getWeightAtPoint } from "./weight.ts";

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
