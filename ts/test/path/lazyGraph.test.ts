import { describe, it } from "node:test";
import assert from "node:assert";
import { LazyGraph } from "../../src/game/map/path/graph/lazyGraph.ts";

describe("LazyGraph", () => {
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
        const lazyGraph = new LazyGraph(() => 1);
        const node = lazyGraph.nodeAt(0, 0);
        assert.ok(node);
        assert.strictEqual(node.isDirty, false);
        lazyGraph.markDirtyNode(node);
        assert.strictEqual(node.isDirty, true);
    });

    it("Can get neighbor of graph node", () => {
        // Block the western neighbor (x-1) of (1,1) so it is omitted.
        const lazyGraph = new LazyGraph((point) =>
            point.x === 0 && point.y === 1 ? null : 1,
        );
        const center = lazyGraph.nodeAt(1, 1);
        assert.ok(center);
        const neighbors = lazyGraph.neighbors(center);

        // East, South, North materialize; West is null and omitted.
        assert.strictEqual(neighbors.length, 3);
        const coords = neighbors.map((n) => `${n.x},${n.y}`).sort();
        assert.deepStrictEqual(coords, ["1,0", "1,2", "2,1"]);
    });
});
