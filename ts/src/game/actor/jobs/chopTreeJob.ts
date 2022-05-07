import { isPointAdjacentTo } from "../../../common/point";
import { GroundTile } from "../../entity/ground";
import { Job } from "../job/job";
import { JobConstraintsError } from "../job/jobConstraintsError";
import { MultipleStepJob } from "../job/multipleStepJob";
import { MoveToJob } from "./moveToJob";

export class ChopTreeJob extends MultipleStepJob {
    private tile: GroundTile;

    constructor(tree: GroundTile) {
        super();
        this.tile = tree;
    }
    onStart(): void {
        // If the tree is next to us we just push the chop job
        // if the tree is not next to us we also push a move to job
        const tilePosition = { x: this.tile.tileX, y: this.tile.tileY };
        const subJobs: Job[] = [];
        if (!isPointAdjacentTo(tilePosition, this.actor.tilePosition)) {
            //The tile was not adjacent to us so we need to move to it first
            const path = this.actor.world.findPath(
                this.actor.tilePosition,
                tilePosition
            );

            if (path.length == 0) {
                throw new JobConstraintsError("Unable to find path to job");
            }

            subJobs.push(new MoveToJob(path));
        }

        subJobs.push(new _ChopTreeJob(this.tile));
        this.setJobs(subJobs);
    }
}

class _ChopTreeJob extends Job {
    private tile: GroundTile;
    private startTick = 0;

    constructor(tile: GroundTile) {
        super();
        this.tile = tile;
    }

    update(tick: number): void {
        if (this.startTick == 0) {
            this.startTick = tick;
        }

        const elapsedTicks = tick - this.startTick;
        if (elapsedTicks > 10) {
            this.tile.hasTree = false;
            console.log("_ChopTreeJob finished");
            this.complete();
        }
    }
}
