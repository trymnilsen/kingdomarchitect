import { addPoint, Point, zeroPoint } from "../common/point";

export class Camera {
    private _position: Point;
    private _;
    constructor() {
        this._position = { x: 0, y: 0 };
    }

    public get position(): Point {
        return this._position;
    }

    public set position(point: Point) {
        this._position = point;
    }

    translate(translation: Point) {
        this._position = addPoint(this._position, translation);
    }

    worldToScreenX(x: number): number {
        return x - this._position.x + window.innerWidth / 2;
    }

    worldToScreenY(y: number): number {
        return y - this._position.y + window.innerHeight / 2;
    }

    screenToWorld(point: Point): Point {
        return {
            x: point.x - window.innerWidth / 2 + this._position.x,
            y: point.y - window.innerHeight / 2 + this._position.y,
        };
    }
}
