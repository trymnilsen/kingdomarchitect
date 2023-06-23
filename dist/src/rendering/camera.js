function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { addPoint, multiplyPoint } from "../common/point.js";
import { TileSize } from "../game/world/tile/tile.js";
export class Camera {
    get position() {
        return this._position;
    }
    set position(point) {
        this._position = {
            x: Math.floor(point.x),
            y: Math.floor(point.y)
        };
    }
    worldSpaceToTileSpace(worldSpace) {
        return {
            x: Math.floor(worldSpace.x / TileSize),
            y: Math.floor(worldSpace.y / TileSize)
        };
    }
    tileSpaceToWorldSpace(tileSpace) {
        return multiplyPoint(tileSpace, TileSize);
    }
    tileSpaceToScreenSpace(tileSpace) {
        const tileWorldPoint = this.tileSpaceToWorldSpace(tileSpace);
        return {
            x: this.worldToScreenX(tileWorldPoint.x),
            y: this.worldToScreenY(tileWorldPoint.y)
        };
    }
    translate(translation) {
        this._position = addPoint(this._position, translation);
    }
    worldToScreenX(x) {
        return Math.floor(x - this._position.x + window.innerWidth / 2);
    }
    worldToScreenY(y) {
        return Math.floor(y - this._position.y + window.innerHeight / 2);
    }
    screenToWorld(point) {
        return {
            x: point.x - window.innerWidth / 2 + this._position.x,
            y: point.y - window.innerHeight / 2 + this._position.y
        };
    }
    constructor(){
        _define_property(this, "_position", void 0);
        this._position = {
            x: 0,
            y: 0
        };
    }
}
