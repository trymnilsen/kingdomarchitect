import { FixedGraph } from "../../src/path/graph/fixedGraph";
import { PathSearch } from "../../src/path/search";
import { createGraphFromTestFile, verifyPath } from "./testGraph";

describe("Maze tests", () => {
    it(`Maze test - maze1.png`, async () => {
        const graph = await createGraphFromTestFile("maze1.png");
        const pathSearch = new PathSearch(
            new FixedGraph(() => {
                return {
                    offsetX: 0,
                    offsetY: 0,
                    weights: graph.graph,
                };
            })
        );
        const pathResult = pathSearch.search(
            graph.start,
            graph.stop,
            true,
            (node) => node.weight
        );

        verifyPath(pathResult, graph);
    });
});
