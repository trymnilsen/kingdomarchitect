import { FixedGraph } from "../../src/path/graph/fixedGraph.js";
import { PathSearch } from "../../src/path/search.js";
import { createGraphFromTestFile, verifyPath } from "./testGraph.js";
import { describe, it } from "node:test";

describe("Maze", () => {
    it("Maze 1", async () => {
        const graph = await createGraphFromTestFile("maze1.png");
        const pathSearch = new PathSearch(
            new FixedGraph(() => {
                return {
                    offsetX: 0,
                    offsetY: 0,
                    weights: graph.graph,
                };
            }),
        );
        const pathResult = pathSearch.search(
            graph.start,
            graph.stop,
            true,
            (node) => node.weight,
        );

        verifyPath(pathResult.path, graph);
    });
});