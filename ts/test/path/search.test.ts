import { describe, it } from "node:test";
import assert from "node:assert";
import { isPointAdjacentTo, pointEquals, type Point } from "../../src/common/point.ts";
import { FixedGraph } from "../../src/game/map/path/graph/fixedGraph.ts";
import { aStarSearch } from "../../src/game/map/path/search.ts";
import { createEmptyGraph } from "./testGraph.ts";

describe("PathSearch", () => {
    it("finds a path on an open grid", () => {
        const graph = createEmptyGraph(14, 14);
        const from: Point = { x: 3, y: 8 };
        const to: Point = { x: 11, y: 8 };

        const result = aStarSearch(from, to, graph);

        assert.ok(result.path.length > 0, "should find a path");
        assert.ok(
            pointEquals(result.path[result.path.length - 1], to),
            "path should end at target",
        );
    });

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

    it("returns empty path when start point is not in the graph", () => {
        // Use a LazyGraph-style empty response: no nodeAt for out-of-bounds.
        // We simulate this by wrapping FixedGraph with a proxy that returns null.
        const inner = createEmptyGraph(5, 5);
        const graph = {
            ...inner,
            nodeAt: (_x: number, _y: number) => null,
        } as unknown as typeof inner;

        const result = aStarSearch({ x: 99, y: 99 }, { x: 3, y: 3 }, graph);

        assert.strictEqual(result.path.length, 0, "should return empty path");
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

    describe("allowAdjacentStop", () => {
        it("terminates at a node adjacent to the target, not at the target itself", () => {
            const graph = createEmptyGraph(14, 14);
            const from: Point = { x: 3, y: 8 };
            const to: Point = { x: 11, y: 8 };

            const result = aStarSearch(from, to, graph, {
                allowAdjacentStop: true,
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
                allowAdjacentStop: true,
            });

            assert.strictEqual(
                adjacent.path.length,
                full.path.length - 1,
                "adjacent-stop path should be exactly one step shorter",
            );
        });

        it("returns empty path when the start is already adjacent to the target", () => {
            const graph = createEmptyGraph(14, 14);
            // (5,8) and (6,8) are directly adjacent - no movement needed.
            const from: Point = { x: 5, y: 8 };
            const to: Point = { x: 6, y: 8 };

            const result = aStarSearch(from, to, graph, {
                allowAdjacentStop: true,
            });

            assert.strictEqual(
                result.path.length,
                0,
                "no movement needed when already adjacent to target",
            );
        });

        it("succeeds when the target tile is a wall", () => {
            const to: Point = { x: 11, y: 8 };
            const from: Point = { x: 3, y: 8 };
            // Target tile is impassable, but allowAdjacentStop should still
            // find a path to the tile next to it.
            const graph = FixedGraph.createWithWidthAndHeight(14, 14, (p) => {
                return pointEquals(p, to) ? 0 : 1;
            });

            const result = aStarSearch(from, to, graph, {
                allowAdjacentStop: true,
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

        it("without the option, fails to reach a walled target via full path", () => {
            const to: Point = { x: 11, y: 8 };
            const from: Point = { x: 3, y: 8 };
            const graph = FixedGraph.createWithWidthAndHeight(14, 14, (p) => {
                return pointEquals(p, to) ? 0 : 1;
            });

            const result = aStarSearch(from, to, graph);

            // Without the option the search never terminates at the wall node,
            // so the last node in the result is not the intended target.
            const lastNode = result.path[result.path.length - 1];
            assert.ok(
                !pointEquals(lastNode, to),
                "path should not end at the walled tile",
            );
        });
    });
});
