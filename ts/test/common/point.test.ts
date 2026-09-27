import { describe, it } from "node:test";
import assert from "node:assert";
import {
    adjacentPoints,
    chebyshevDistance,
    closestPointOnLine,
    isPointAdjacentTo,
    pointEquals,
} from "../../src/common/point.ts";
import type { Point } from "../../src/common/point.ts";

describe("Point", () => {
    it("chebyshev distance counts diagonals same as cardinals", () => {
        const center = { x: 4, y: 4 };
        assert.strictEqual(chebyshevDistance(center, { x: 5, y: 4 }), 1);
        assert.strictEqual(chebyshevDistance(center, { x: 5, y: 5 }), 1);
        assert.strictEqual(chebyshevDistance(center, { x: 3, y: 3 }), 1);
        assert.strictEqual(chebyshevDistance(center, { x: 6, y: 5 }), 2);
        assert.strictEqual(chebyshevDistance(center, { x: 4, y: 4 }), 0);
        assert.strictEqual(chebyshevDistance(center, { x: 1, y: 8 }), 4);
    });

    it("get adjacent points", () => {
        const point = { x: 3, y: 2 };
        const points = adjacentPoints(point);

        function includesPoint(
            listOfPoints: Point[],
            pointToTest: Point,
        ): boolean {
            return listOfPoints.some((item) => {
                return pointEquals(item, pointToTest);
            });
        }

        function verifyAdjacent(pointsToVerify: Point[]) {
            assert.strictEqual(
                includesPoint(pointsToVerify, { x: 2, y: 2 }),
                true,
            );
            assert.strictEqual(
                includesPoint(pointsToVerify, { x: 4, y: 2 }),
                true,
            );
            assert.strictEqual(
                includesPoint(pointsToVerify, { x: 3, y: 1 }),
                true,
            );
            assert.strictEqual(
                includesPoint(pointsToVerify, { x: 3, y: 3 }),
                true,
            );
        }

        assert.strictEqual(points.length, 4);
        verifyAdjacent(points);

        const pointsWithDiagonal = adjacentPoints(point, true);
        assert.strictEqual(pointsWithDiagonal.length, 8);
        verifyAdjacent(pointsWithDiagonal);
        assert.strictEqual(
            includesPoint(pointsWithDiagonal, { x: 2, y: 1 }),
            true,
        );
        assert.strictEqual(
            includesPoint(pointsWithDiagonal, { x: 2, y: 3 }),
            true,
        );
        assert.strictEqual(
            includesPoint(pointsWithDiagonal, { x: 4, y: 1 }),
            true,
        );
        assert.strictEqual(
            includesPoint(pointsWithDiagonal, { x: 4, y: 3 }),
            true,
        );
    });

    it("two distant points on the same axis are not adjacent", () => {
        const pointOne = { x: 6, y: 2 };
        const pointTwo = { x: 4, y: 2 };
        const isAdjacent = isPointAdjacentTo(pointOne, pointTwo);
        assert.strictEqual(isAdjacent, false);
    });

    it("closest point on diagonal line", () => {
        const aPoint = { x: 0, y: 0 };
        const bPoint = { x: 10, y: 10 };
        const pPoint = { x: 10, y: 0 };
        const point = closestPointOnLine(aPoint, bPoint, pPoint);
        assert.deepStrictEqual(point, { x: 5, y: 5 });
    });
});
