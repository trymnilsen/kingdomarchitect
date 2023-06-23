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
import { NeverAssignConstraint } from "../constraint/neverAssignConstraint.js";
import { Job } from "../job.js";
import { MoveToBeforeJob } from "./moveToBeforeJob.js";
export class CollectCoinJob extends MoveToBeforeJob {
    constructor(tileToCollectCoinOn){
        super(new _CollectCoinJob(tileToCollectCoinOn), new NeverAssignConstraint());
    }
}
class _CollectCoinJob extends Job {
    get tileX() {
        return this.tile.x;
    }
    get tileY() {
        return this.tile.y;
    }
    update(tick) {
        //TODO: add back coin collection of coins
        /*
        const actors = this.actor.world.actors;
        const coinActor = actors.getActor({ x: this.tileX, y: this.tileY });
        if (coinActor) {
            console.log("Removing coin at: ", this.tileX, this.tileY);
            actors.removeActor(coinActor);
        }
        */ this.complete();
    }
    constructor(tile){
        super();
        _define_property(this, "tile", void 0);
        this.tile = tile;
    }
}
