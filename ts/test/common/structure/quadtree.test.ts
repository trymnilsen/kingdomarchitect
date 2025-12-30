import { describe, it } from "node:test";
import assert from "node:assert";
import { QuadTree } from "../../../src/common/structure/quadtree.ts";

// Define helper functions for testing
function createSampleTree(): QuadTree {
    const bounds = { x: 0, y: 0, width: 100, height: 100 };
    const quadTree = new QuadTree(bounds);

    quadTree.insert({ x: 10, y: 10, width: 20, height: 20 });
    quadTree.insert({ x: 40, y: 40, width: 10, height: 10 });
    quadTree.insert({ x: 60, y: 60, width: 20, height: 20 });
    quadTree.insert({ x: 80, y: 80, width: 5, height: 5 });

    return quadTree;
}

describe("QuadTree", () => {
    it("should insert rectangles without errors", () => {
        const quadTree = createSampleTree();
        assert.doesNotThrow(() => {
            quadTree.insert({ x: 20, y: 20, width: 5, height: 5 });
        });
    });

    it("should query a rectangle and find intersecting objects", () => {
        const quadTree = createSampleTree();
        const results = quadTree.query({ x: 5, y: 5, width: 30, height: 30 });

        assert.strictEqual(
            results.length,
            1,
            "Should find 1 intersecting rectangle",
        );
        assert.deepStrictEqual(results[0], {
            x: 10,
            y: 10,
            width: 20,
            height: 20,
        });
    });

    it("should return an empty array for a query with no intersections", () => {
        const quadTree = createSampleTree();
        const results = quadTree.query({ x: 90, y: 90, width: 10, height: 10 });

        assert.equal(
            results.length,
            0,
            "Should find no intersecting rectangles",
        );
    });

    it("should subdivide when max capacity is reached", () => {
        const bounds = { x: 0, y: 0, width: 100, height: 100 };
        const quadTree = new QuadTree(bounds);

        // Insert enough rectangles to trigger subdivision
        quadTree.insert({ x: 10, y: 10, width: 5, height: 5 });
        quadTree.insert({ x: 20, y: 20, width: 5, height: 5 });
        quadTree.insert({ x: 30, y: 30, width: 5, height: 5 });
        quadTree.insert({ x: 40, y: 40, width: 5, height: 5 });

        assert.ok(
            quadTree.divided,
            "QuadTree should subdivide after reaching capacity",
        );
    });
});
