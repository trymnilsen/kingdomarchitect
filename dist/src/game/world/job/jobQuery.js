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
import { ChopTreeJob } from "./jobs/chopTreeJob.js";
export class JobByGroundTileQuery {
    matches(job) {
        if (job instanceof ChopTreeJob) {
            return false;
        //TODO: add back in
        /*  return pointEquals(
                {
                    x: this.tile.tileX,
                    y: this.tile.tileY,
                },
                {
                    x: job.tileToChop.tileX,
                    y: job.tileToChop.tileY,
                }
            ); */ } else {
            return false;
        }
    }
    constructor(tile){
        _define_property(this, "tile", void 0);
        this.tile = tile;
    }
}
