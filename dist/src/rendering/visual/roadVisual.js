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
import { TileSize } from "../../game/world/tile/tile.js";
export class RoadVisual {
    onDraw(context) {
        context.drawRectangle({
            x: this.position.x * TileSize + 10,
            y: this.position.y * TileSize + 10,
            width: 16,
            height: 16,
            fill: "#7d3c04"
        });
    }
    constructor(position){
        _define_property(this, "position", void 0);
        this.position = position;
    }
}
