import { addPoint, multiplyPoint, Point } from "../common/point.js";
import { TileSize } from "../game/map/tile.js";

export class Camera {
    private _position: Point;
    private _halfWindowSize: Point;
    private _windowSize: Point;

    constructor(windowSize: Point) {
        this._windowSize = windowSize;
        this._position = { x: 0, y: 0 };
        this._halfWindowSize = {
            x: Math.floor(windowSize.x / 2),
            y: Math.floor(windowSize.y / 2),
        };
    }

    get position(): Point {
        return this._position;
    }

    set position(point: Point) {
        this._position = {
            x: Math.floor(point.x),
            y: Math.floor(point.y),
        };
    }

    get windowSize(): Point {
        return this._windowSize;
    }

    worldSpaceToTileSpace(worldSpace: Point): Point {
        return {
            x: Math.floor(worldSpace.x / TileSize),
            y: Math.floor(worldSpace.y / TileSize),
        };
    }

    tileSpaceToWorldSpace(tileSpace: Point): Point {
        return multiplyPoint(tileSpace, TileSize);
    }

    tileSpaceToScreenSpace(tileSpace: Point): Point {
        const tileWorldPoint = this.tileSpaceToWorldSpace(tileSpace);
        return {
            x: this.worldToScreenX(tileWorldPoint.x),
            y: this.worldToScreenY(tileWorldPoint.y),
        };
    }

    translate(translation: Point) {
        this._position = addPoint(this._position, translation);
    }

    worldToScreenX(x: number): number {
        return Math.floor(x - this._position.x + this._halfWindowSize.x);
    }

    worldToScreenY(y: number): number {
        return Math.floor(y - this._position.y + this._halfWindowSize.y);
    }

    screenToWorld(point: Point): Point {
        return {
            x: point.x - this._halfWindowSize.x + this._position.x,
            y: point.y - this._halfWindowSize.y + this._position.y,
        };
    }
}
