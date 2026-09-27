import { describe, it } from "node:test";
import assert from "node:assert";
import {
    isPointAdjacentTo,
    pointEquals,
    type Point,
} from "../../src/common/point.ts";
import { FixedGraph } from "../../src/game/map/path/graph/fixedGraph.ts";
import { aStarSearch } from "../../src/game/map/path/search.ts";
import { createEmptyGraph } from "./testGraph.ts";

describe("PathSearch", () => {
    it("selects cheapest path when weights differ", () => {
        // Two routes from (3,8) to (11,8):
        //   - straight y=8: all weight 1
        //   - detour through y=9: weight 10 per tile
        // The straight route should win.
        const from: Point = { x: 3, y: 8 };
        const to: Point = { x: 11, y: 8 };
        const graph = FixedGraph.createWithWidthAndHeight(14, 14, (p) => {
            if (p.y === 9) return 10;
            return 1;
        });

        const result = aStarSearch(from, to, graph);

        assert.ok(result.path.length > 0, "should find a path");
        for (const node of result.path) {
            assert.notStrictEqual(
                node.y,
                9,
                "optimal path should not pass through the high-cost row",
            );
        }
    });

    it("returns partial path when end is not reachable", () => {
        // Surround the target with walls so it's unreachable.
        const from: Point = { x: 3, y: 8 };
        const to: Point = { x: 11, y: 8 };
        const graph = FixedGraph.createWithWidthAndHeight(14, 14, (p) => {
            const isWall =
                (p.x === 10 && p.y === 8) ||
                (p.x === 12 && p.y === 8) ||
                (p.x === 11 && p.y === 7) ||
                (p.x === 11 && p.y === 9);
            return isWall ? 0 : 1;
        });

        const result = aStarSearch(from, to, graph);

        // The path cannot reach (11,8), but a partial result towards it is returned.
        assert.ok(
            result.path.length > 0,
            "should return a partial path towards the blocked target",
        );
        assert.ok(
            !pointEquals(result.path[result.path.length - 1], to),
            "partial path should not reach the unreachable target",
        );
    });

    describe("isGoal", () => {
        it("terminates at a node adjacent to the target, not at the target itself", () => {
            const graph = createEmptyGraph(14, 14);
            const from: Point = { x: 3, y: 8 };
            const to: Point = { x: 11, y: 8 };

            const result = aStarSearch(from, to, graph, {
                isGoal: (node) => isPointAdjacentTo(node, to),
            });

            assert.ok(result.path.length > 0, "should find a path");
            const lastNode = result.path[result.path.length - 1];
            assert.ok(
                isPointAdjacentTo(lastNode, to),
                `last node {${lastNode.x},${lastNode.y}} should be adjacent to target {${to.x},${to.y}}`,
            );
            assert.ok(
                !pointEquals(lastNode, to),
                "path should stop before the target, not at it",
            );
        });

        it("produces a path one step shorter than without the option", () => {
            const graph = createEmptyGraph(14, 14);
            const from: Point = { x: 3, y: 8 };
            const to: Point = { x: 11, y: 8 };

            const full = aStarSearch(from, to, graph);
            const adjacent = aStarSearch(from, to, graph, {
                isGoal: (node) => isPointAdjacentTo(node, to),
            });

            assert.strictEqual(
                adjacent.path.length,
                full.path.length - 1,
                "adjacent-stop path should be exactly one step shorter",
            );
        });

        it("succeeds when the target tile is a wall", () => {
            const to: Point = { x: 11, y: 8 };
            const from: Point = { x: 3, y: 8 };
            // Target tile is impassable, but an adjacency goal should still
            // find a path to the tile next to it.
            const graph = FixedGraph.createWithWidthAndHeight(14, 14, (p) => {
                return pointEquals(p, to) ? 0 : 1;
            });

            const result = aStarSearch(from, to, graph, {
                isGoal: (node) => isPointAdjacentTo(node, to),
            });

            assert.ok(
                result.path.length > 0,
                "should find path ending adjacent to the wall",
            );
            const lastNode = result.path[result.path.length - 1];
            assert.ok(
                isPointAdjacentTo(lastNode, to),
                `last node {${lastNode.x},${lastNode.y}} should be adjacent to walled target {${to.x},${to.y}}`,
            );
        });

        it("stops at any node the goal accepts, not only adjacent ones", () => {
            const graph = createEmptyGraph(14, 14);
            const from: Point = { x: 3, y: 8 };
            const to: Point = { x: 11, y: 8 };

            // Nothing to do with adjacency. Stop at column 7, four tiles short
            // of the target, the same shape as a bow's reach check
            const result = aStarSearch(from, to, graph, {
                isGoal: (node) => node.x >= 7,
            });

            const lastNode = result.path[result.path.length - 1];
            assert.strictEqual(
                lastNode.x,
                7,
                "the search should end the moment the goal is satisfied",
            );
        });
    });
});
