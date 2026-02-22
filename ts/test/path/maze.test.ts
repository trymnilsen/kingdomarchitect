import { describe, it } from "node:test";
import { FixedGraph } from "../../src/game/map/path/graph/fixedGraph.ts";
import { aStarSearch } from "../../src/game/map/path/search.ts";
import { createGraphFromTestFile, verifyPath } from "./testGraph.ts";

describe("Maze", () => {
    it("Maze 1", async () => {
        const graph = await createGraphFromTestFile("maze1.png");
        const fixedGraph = new FixedGraph(() => {
            return {
                offsetX: 0,
                offsetY: 0,
                weights: graph.graph,
            };
        });
        const pathResult = aStarSearch(
            graph.start,
            graph.stop,
            fixedGraph,
            {
                allowAdjacentStop: true,
                weightModifier: (node) => node.weight,
            },
        );

        verifyPath(pathResult.path, graph);
    });
});
