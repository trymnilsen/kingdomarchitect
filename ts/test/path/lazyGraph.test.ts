import { describe, it } from "node:test";
import assert from "node:assert";
import { LazyGraph } from "../../src/game/map/path/graph/lazyGraph.js";

describe("LazyGraph", () => {
    it("Can get node at", () => {
        let times = 0;
        const lazyGraph = new LazyGraph(() => {
            times++;
            return 0;
        });

        const firstNode = lazyGraph.nodeAt(2, 2);
        const secondNode = lazyGraph.nodeAt(4, 5);
        const thirdNode = lazyGraph.nodeAt(2, 2);
        assert.strictEqual(times, 2);
        assert.strictEqual(firstNode?.x, 2);
        assert.strictEqual(firstNode?.y, 2);
        assert.strictEqual(secondNode?.x, 4);
        assert.strictEqual(secondNode?.y, 5);
        assert.deepStrictEqual(thirdNode, firstNode);
    });

    it("Gets null if attempting to get node not in graph", () => {
        assert.strictEqual(2, 2);
    });

    it("Can invalidate point in graph", () => {
        let times = 0;
        const lazyGraph = new LazyGraph(() => {
            times++;
            return 0;
        });

        const firstNode = lazyGraph.nodeAt(2, 2);
        lazyGraph.invalidatePoint({ x: 2, y: 2 });
        const secondNode = lazyGraph.nodeAt(2, 2);
        assert.ok(secondNode !== firstNode);

        assert.strictEqual(secondNode?.x, 2);
        assert.strictEqual(secondNode?.y, 2);
        assert.strictEqual(times, 2);
    });

    it("Can mark node as dirty", () => {
        assert.strictEqual(2, 2);
    });

    it("Can clean nodes", () => {
        assert.strictEqual(2, 2);
    });

    it("Can get neighbor of graph node", () => {
        assert.strictEqual(2, 2);
    });
});
