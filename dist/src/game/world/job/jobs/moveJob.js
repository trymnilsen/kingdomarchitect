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
import { TileSize } from "../../tile/tile.js";
import { Job } from "../job.js";
/**
 * Represents a job that will move through a specific path and complete once
 * the actor of this job is at the end of the path
 */ export class MoveJob extends Job {
    update(tick) {
        const newPosition = this.path.pop();
        if (newPosition) {
            this.entity.worldPosition = newPosition;
        } else {
            this.complete();
        }
    }
    onDraw(renderContext) {
        for (const pathPoint of this.path){
            renderContext.drawRectangle({
                x: pathPoint.x * TileSize + 14,
                y: pathPoint.y * TileSize + 14,
                width: 8,
                height: 8,
                fill: "purple"
            });
        }
    }
    constructor(path, constraint){
        super(constraint);
        _define_property(this, "path", void 0);
        this.path = path.reverse();
    }
}
