import { describe, it, expect } from "vitest";
import {
    addPoint,
    adjacentPoints,
    changeX,
    changeY,
    closestPointOnLine,
    distance,
    dotProduct,
    invert,
    isPointAdjacentTo,
    multiplyPoint,
    Point,
    pointEquals,
    subtractPoint,
    zeroPoint,
} from "../../src/common/point.js";

describe("Point", () => {
    it("zero point is not mutable", () => {
        const firstZeroPoint = zeroPoint();
        const secondZeroPoint = zeroPoint();
        secondZeroPoint.y = 2;
        expect(secondZeroPoint.y).toBe(2);
        expect(firstZeroPoint.y).toBe(0);
    });

    it("add two points", () => {
        const firstPoint = { x: 3, y: 2 };
        const secondPoint = { x: 4, y: -1 };
        const addedPoints = addPoint(firstPoint, secondPoint);
        expect(addedPoints.x).toBe(7);
        expect(addedPoints.y).toBe(1);
    });

    it("subtract two points", () => {
        const firstPoint = { x: 3, y: 2 };
        const secondPoint = { x: 4, y: -1 };
        const addedPoints = subtractPoint(firstPoint, secondPoint);
        expect(addedPoints.x).toBe(-1);
        expect(addedPoints.y).toBe(3);
    });

    it("change only x value", () => {
        const point = { x: 3, y: 2 };
        const translatedPoint = changeX(point, 5);
        expect(translatedPoint.x).toBe(8);
        expect(translatedPoint.y).toBe(2);
    });

    it("change only y value", () => {
        const point = { x: 3, y: 2 };
        const translatedPoint = changeY(point, 5);
        expect(translatedPoint.y).toBe(7);
        expect(translatedPoint.x).toBe(3);
    });

    it("invert point", () => {
        const point = { x: 3, y: 2 };
        const invertedPoint = invert(point);
        expect(invertedPoint.x).toBe(-3);
        expect(invertedPoint.y).toBe(-2);
    });

    it("multiply point", () => {
        const point = { x: 3, y: 2 };
        const multipliedPoint = multiplyPoint(point, 2);
        expect(multipliedPoint.x).toBe(6);
        expect(multipliedPoint.y).toBe(4);
    });

    it("distance between points", () => {
        const firstPoint = { x: 0, y: 3 };
        const secondPoint = { x: 0, y: 6 };
        const distanceBetween = distance(firstPoint, secondPoint);
        expect(distanceBetween).toBe(3);

        const firstDiagonalPoint = { x: 3, y: 3 };
        const secondDiagonalPoint = { x: 6, y: 6 };
        const diagonalDistance = distance(
            firstDiagonalPoint,
            secondDiagonalPoint,
        );
        expect(diagonalDistance.toPrecision(2)).toBe("4.2");
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
            expect(includesPoint(pointsToVerify, { x: 2, y: 2 })).toBe(true);
            expect(includesPoint(pointsToVerify, { x: 4, y: 2 })).toBe(true);
            expect(includesPoint(pointsToVerify, { x: 3, y: 1 })).toBe(true);
            expect(includesPoint(pointsToVerify, { x: 3, y: 3 })).toBe(true);
        }

        expect(points.length).toBe(4);
        verifyAdjacent(points);

        const pointsWithDiagonal = adjacentPoints(point, true);
        expect(pointsWithDiagonal.length).toBe(8);
        verifyAdjacent(pointsWithDiagonal);
        expect(includesPoint(pointsWithDiagonal, { x: 2, y: 1 })).toBe(true);
        expect(includesPoint(pointsWithDiagonal, { x: 2, y: 3 })).toBe(true);
        expect(includesPoint(pointsWithDiagonal, { x: 4, y: 1 })).toBe(true);
        expect(includesPoint(pointsWithDiagonal, { x: 4, y: 3 })).toBe(true);
    });

    it("check if one point is adjacent to another", () => {
        const pointOne = { x: 3, y: 2 };
        const pointTwo = { x: 4, y: 2 };
        const isAdjacent = isPointAdjacentTo(pointOne, pointTwo);
        expect(isAdjacent).toBe(true);
    });

    it("two distant points on the same axis are not adjacent", () => {
        const pointOne = { x: 6, y: 2 };
        const pointTwo = { x: 4, y: 2 };
        const isAdjacent = isPointAdjacentTo(pointOne, pointTwo);
        expect(isAdjacent).toBe(false);
    });

    it("dot product", () => {
        const pointOne = { x: -6, y: 8 };
        const pointTwo = { x: 5, y: 12 };
        const dot = dotProduct(pointOne, pointTwo);
        expect(dot).toBe(66);
    });

    it("closest point on vertical line", () => {
        const aPoint = { x: 2, y: 10 };
        const bPoint = { x: 2, y: 50 };
        const pPoint = { x: 6, y: 30 };
        const point = closestPointOnLine(aPoint, bPoint, pPoint);
        expect(point).to.deep.equal({ x: 2, y: 30 });
    });

    it("closest point on horizontal line", () => {
        const aPoint = { x: 0, y: 0 };
        const bPoint = { x: 20, y: 0 };
        const pPoint = { x: 10, y: 10 };
        const point = closestPointOnLine(aPoint, bPoint, pPoint);
        expect(point).to.deep.equal({ x: 10, y: 0 });
    });

    it("closest point on diagonal line", () => {
        const aPoint = { x: 0, y: 0 };
        const bPoint = { x: 10, y: 10 };
        const pPoint = { x: 10, y: 0 };
        const point = closestPointOnLine(aPoint, bPoint, pPoint);
        expect(point).to.deep.equal({ x: 5, y: 5 });
    });

    it("closest point on line where the point is the end", () => {
        const aPoint = { x: 0, y: 0 };
        const bPoint = { x: 10, y: 10 };
        const pPoint = { x: 500, y: 500 };
        const point = closestPointOnLine(aPoint, bPoint, pPoint);
        expect(point).to.deep.equal({ x: 10, y: 10 });
    });

    it("closest point on line where the point is the start", () => {
        const aPoint = { x: 2, y: 2 };
        const bPoint = { x: 10, y: 10 };
        const pPoint = { x: -200, y: -200 };
        const point = closestPointOnLine(aPoint, bPoint, pPoint);
        expect(point).to.deep.equal({ x: 2, y: 2 });
    });
});
