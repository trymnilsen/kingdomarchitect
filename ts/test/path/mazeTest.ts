import { PathSearch } from "../../src/path/search";
import {
    createGraphFromTestFile,
    TestGraphGenerator,
    verifyPath,
} from "./testGraph";

describe("Maze tests", () => {
    it(`Maze test - maze1.png`, async () => {
        const graph = await createGraphFromTestFile("maze1.png");
        const pathSearch = new PathSearch(new TestGraphGenerator(graph));
        const pathResult = pathSearch.search(
            graph.start,
            graph.stop,
            true,
            (node) => node.weight
        );

        verifyPath(pathResult, graph);
    });
});
