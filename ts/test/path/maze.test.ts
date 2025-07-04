import { describe, it } from "node:test";
import { FixedGraph } from "../../src/module/path/graph/fixedGraph.js";
import { aStarSearch } from "../../src/module/path/search.js";
import { createGraphFromTestFile, verifyPath } from "./testGraph.js";

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
            true,
            (node) => node.weight,
        );

        verifyPath(pathResult.path, graph);
    });
});
