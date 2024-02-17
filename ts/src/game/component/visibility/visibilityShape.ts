import { Point, addPoint, zeroPoint } from "../../../common/point.js";

/**
 * VisibilityShape is a class that holds a single point and a pattern
 * when either is set, all of the points in pattern is calculated based on
 * the offset by the single point. This makes it possible to have a list
 * of points making up a pattern that will be return on each getPoints call
 * but the calculation will only be done on updates and not on every get call
 */
export class VisibilityShape {
    private _point: Point = zeroPoint();
    private _pattern: Point[] = [];
    private _offsetPattern: Point[] = [];

    get pattern(): Point[] {
        return this._pattern;
    }

    get point(): Point {
        return this._point;
    }

    updatePoint(point: Point) {
        this._point = point;
        this.calculateOffsetPoints();
    }

    updatePattern(pattern: Point[]) {
        this._pattern = pattern;
        this.calculateOffsetPoints();
    }

    getPoints(): Point[] {
        return this._offsetPattern;
    }

    private calculateOffsetPoints() {
        this._offsetPattern = this._pattern.map((patternPoint) =>
            addPoint(this._point, patternPoint),
        );
    }
}
