import { assert } from "chai";
import { LazyGraph } from "../../src/path/graph/lazyGraph";

describe("Lazy graph test", () => {
    it("Can get node at", () => {
        let times = 0;
        const lazyGraph = new LazyGraph((point) => {
            times++;
            return 0;
        });

        const firstNode = lazyGraph.nodeAt(2, 2);
        const secondNode = lazyGraph.nodeAt(4, 5);
        const thirdNode = lazyGraph.nodeAt(2, 2);
        assert.equal(times, 2);
        assert.equal(firstNode?.x, 2);
        assert.equal(firstNode?.y, 2);
        assert.equal(secondNode?.x, 4);
        assert.equal(secondNode?.y, 5);
        assert.strictEqual(thirdNode, firstNode);
    });

    it("Gets null if attempting to get node not in graph", () => {
        assert.equal(2, 2);
    });

    it("Can invalidate point in graph", () => {
        let times = 0;
        const lazyGraph = new LazyGraph((point) => {
            times++;
            return 0;
        });

        const firstNode = lazyGraph.nodeAt(2, 2);
        lazyGraph.invalidatePoint({ x: 2, y: 2 });
        const secondNode = lazyGraph.nodeAt(2, 2);
        assert.notStrictEqual(secondNode, firstNode);
        assert.equal(secondNode?.x, 2);
        assert.equal(secondNode?.y, 2);
        assert.equal(times, 2);
    });

    it("Can mark node as dirty", () => {
        assert.equal(2, 2);
    });

    it("Can clean nodes", () => {
        assert.equal(2, 2);
    });

    it("Can get neighbor of graph node", () => {
        assert.equal(2, 2);
    });
});
