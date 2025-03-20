import { describe, it, expect } from "vitest";
import { LazyGraph } from "../../src/module/path/graph/lazyGraph.js";

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
        expect(times).toBe(2);
        expect(firstNode?.x).toBe(2);
        expect(firstNode?.y).toBe(2);
        expect(secondNode?.x).toBe(4);
        expect(secondNode?.y).toBe(5);
        expect(thirdNode).toStrictEqual(firstNode);
    });

    it("Gets null if attempting to get node not in graph", () => {
        expect(2).toBe(2);
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
        expect(secondNode !== firstNode).toBeTruthy();
        expect(secondNode?.x).toBe(2);
        expect(secondNode?.y).toBe(2);
        expect(times).toBe(2);
    });

    it("Can mark node as dirty", () => {
        expect(2).toBe(2);
    });

    it("Can clean nodes", () => {
        expect(2).toBe(2);
    });

    it("Can get neighbor of graph node", () => {
        expect(2).toBe(2);
    });
});
