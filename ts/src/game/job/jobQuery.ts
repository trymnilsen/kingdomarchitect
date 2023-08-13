import { GroundTile } from "../tile/ground.js";
import { ChopTreeJob } from "./jobs/chopTreeJob.js";
import { Job } from "./job.js";

export interface JobQuery {
    matches(job: Job): boolean;
}

export class JobByGroundTileQuery implements JobQuery {
    constructor(private tile: GroundTile) {}
    matches(job: Job): boolean {
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
            ); */
        } else {
            return false;
        }
    }
}
