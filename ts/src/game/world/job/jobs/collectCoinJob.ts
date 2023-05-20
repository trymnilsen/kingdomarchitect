import { Point } from "../../../../common/point";
import { NeverAssignConstraint } from "../constraint/neverAssignConstraint";
import { Job } from "../job";
import { MoveToBeforeJob } from "./moveToBeforeJob";

export class CollectCoinJob extends MoveToBeforeJob {
    constructor(tileToCollectCoinOn: Point) {
        super(
            new _CollectCoinJob(tileToCollectCoinOn),
            new NeverAssignConstraint()
        );
    }
}

class _CollectCoinJob extends Job {
    private tile: Point;

    get tileX(): number {
        return this.tile.x;
    }

    get tileY(): number {
        return this.tile.y;
    }

    constructor(tile: Point) {
        super();
        this.tile = tile;
    }

    update(tick: number): void {
        //TODO: add back coin collection of coins
        /*
        const actors = this.actor.world.actors;
        const coinActor = actors.getActor({ x: this.tileX, y: this.tileY });
        if (coinActor) {
            console.log("Removing coin at: ", this.tileX, this.tileY);
            actors.removeActor(coinActor);
        }
        */
        this.complete();
    }
}
