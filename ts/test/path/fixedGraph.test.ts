import { describe, it } from "node:test";
import assert from "node:assert";
import { FixedGraph } from "../../src/game/map/path/graph/fixedGraph.ts";

// 3x3 grid where weight encodes coordinates so we can verify mapping.
function makeGraph(): FixedGraph {
    return FixedGraph.createWithWidthAndHeight(
        3,
        3,
        (point) => 1 + point.x * 10 + point.y,
    );
}

describe("FixedGraph", () => {
    it("nodeAt returns the node with matching coordinates and weight", () => {
        const graph = makeGraph();
        const node = graph.nodeAt(2, 1);
        assert.strictEqual(node.x, 2);
        assert.strictEqual(node.y, 1);
        assert.strictEqual(node.weight, 1 + 2 * 10 + 1);
    });

    it("getNodes returns width * height nodes", () => {
        const graph = makeGraph();
        assert.strictEqual(graph.getNodes().length, 9);
    });

    it("a corner node has two orthogonal neighbors", () => {
        const graph = makeGraph();
        const corner = graph.nodeAt(0, 0);
        assert.strictEqual(graph.neighbors(corner).length, 2);
    });

    it("an interior node has four orthogonal neighbors", () => {
        const graph = makeGraph();
        const interior = graph.nodeAt(1, 1);
        assert.strictEqual(graph.neighbors(interior).length, 4);
    });

    it("markDirtyNode + cleanDirtyNodes resets f/g/h and isDirty", () => {
        const graph = makeGraph();
        const node = graph.nodeAt(1, 1);
        node.f = 5;
        node.g = 4;
        node.h = 3;
        node.isDirty = true;
        node.visited = true;

        graph.markDirtyNode(node);
        graph.cleanDirtyNodes();

        assert.strictEqual(node.f, 0);
        assert.strictEqual(node.g, 0);
        assert.strictEqual(node.h, 0);
        assert.strictEqual(node.isDirty, false);
        assert.strictEqual(node.visited, false);
    });
});
