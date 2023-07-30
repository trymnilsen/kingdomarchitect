import { addPoint, multiplyPoint, Point } from "../common/point.js";
import { TileSize } from "../game/world/tile/tile.js";

export class Camera {
    private _position: Point;
    constructor() {
        this._position = { x: 0, y: 0 };
    }

    public get position(): Point {
        return this._position;
    }

    public set position(point: Point) {
        this._position = {
            x: Math.floor(point.x),
            y: Math.floor(point.y),
        };
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
        return Math.floor(
            x - this._position.x + Math.floor(window.innerWidth / 2)
        );
    }

    worldToScreenY(y: number): number {
        return Math.floor(
            y - this._position.y + Math.floor(window.innerHeight / 2)
        );
    }

    screenToWorld(point: Point): Point {
        return {
            x: point.x - Math.floor(window.innerWidth / 2) + this._position.x,
            y: point.y - Math.floor(window.innerHeight / 2) + this._position.y,
        };
    }
}
