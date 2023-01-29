import { assert } from "chai";
import {
    addPoint,
    adjacentPoints,
    changeX,
    changeY,
    distance,
    invert,
    isPointAdjacentTo,
    multiplyPoint,
    Point,
    subtractPoint,
    zeroPoint,
} from "../../src/common/point";

describe("Point test", () => {
    it("zero point is not mutable", () => {
        const firstZeroPoint = zeroPoint();
        const secondZeroPoint = zeroPoint();
        secondZeroPoint.y = 2;
        assert.equal(secondZeroPoint.y, 2);
        assert.equal(firstZeroPoint.y, 0);
    });

    it("add two points", () => {
        const firstPoint = { x: 3, y: 2 };
        const secondPoint = { x: 4, y: -1 };
        const addedPoints = addPoint(firstPoint, secondPoint);
        assert.equal(addedPoints.x, 7);
        assert.equal(addedPoints.y, 1);
    });

    it("subtract two points", () => {
        const firstPoint = { x: 3, y: 2 };
        const secondPoint = { x: 4, y: -1 };
        const addedPoints = subtractPoint(firstPoint, secondPoint);
        assert.equal(addedPoints.x, -1);
        assert.equal(addedPoints.y, 3);
    });

    it("change only x value", () => {
        const point = { x: 3, y: 2 };
        const translatedPoint = changeX(point, 5);
        assert.equal(translatedPoint.x, 8);
        assert.equal(translatedPoint.y, 2);
    });

    it("change only y value", () => {
        const point = { x: 3, y: 2 };
        const translatedPoint = changeY(point, 5);
        assert.equal(translatedPoint.y, 7);
        assert.equal(translatedPoint.x, 3);
    });

    it("invert point", () => {
        const point = { x: 3, y: 2 };
        const invertedPoint = invert(point);
        assert.equal(invertedPoint.x, -3);
        assert.equal(invertedPoint.y, -2);
    });

    it("multiply point", () => {
        const point = { x: 3, y: 2 };
        const multipliedPoint = multiplyPoint(point, 2);
        assert.equal(multipliedPoint.x, 6);
        assert.equal(multipliedPoint.y, 4);
    });

    it("distance between points", () => {
        const firstPoint = { x: 0, y: 3 };
        const secondPoint = { x: 0, y: 6 };
        const distanceBetween = distance(firstPoint, secondPoint);
        assert.equal(distanceBetween, 3);

        const firstDiagonalPoint = { x: 3, y: 3 };
        const secondDiagonalPoint = { x: 6, y: 6 };
        const diagonalDistance = distance(
            firstDiagonalPoint,
            secondDiagonalPoint
        );
        assert.equal(diagonalDistance.toPrecision(2), "4.2");
    });

    it("get adjacent points", () => {
        const point = { x: 3, y: 2 };
        const points = adjacentPoints(point);

        function verifyAdjacent(pointsToVerify: Point[]) {
            assert.deepInclude(pointsToVerify, { x: 2, y: 2 });
            assert.deepInclude(pointsToVerify, { x: 4, y: 2 });
            assert.deepInclude(pointsToVerify, { x: 3, y: 1 });
            assert.deepInclude(pointsToVerify, { x: 3, y: 3 });
        }

        assert.equal(points.length, 4);
        verifyAdjacent(points);

        const pointsWithDiagonal = adjacentPoints(point, true);
        assert.equal(pointsWithDiagonal.length, 8);
        verifyAdjacent(pointsWithDiagonal);
        assert.deepInclude(pointsWithDiagonal, { x: 2, y: 1 });
        assert.deepInclude(pointsWithDiagonal, { x: 2, y: 3 });
        assert.deepInclude(pointsWithDiagonal, { x: 4, y: 1 });
        assert.deepInclude(pointsWithDiagonal, { x: 4, y: 3 });
    });

    it("check if one point is adjacent to another", () => {
        const pointOne = { x: 3, y: 2 };
        const pointTwo = { x: 4, y: 2 };
        const isAdjacent = isPointAdjacentTo(pointOne, pointTwo);
        assert.isTrue(isAdjacent);
    });

    it("two distant points on the same axis are not adjacent", () => {
        const pointOne = { x: 6, y: 2 };
        const pointTwo = { x: 4, y: 2 };
        const isAdjacent = isPointAdjacentTo(pointOne, pointTwo);
        assert.isFalse(isAdjacent);
    });
});
