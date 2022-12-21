import { pointEquals } from "../../../common/point";
import { GroundTile } from "../../entity/ground";
import { ChopTreeJob } from "../jobs/chopTreeJob";
import { Job } from "./job";

export interface JobQuery {
    matches(job: Job): boolean;
}

export class JobByGroundTileQuery implements JobQuery {
    constructor(private tile: GroundTile) {}
    matches(job: Job): boolean {
        if (job instanceof ChopTreeJob) {
            return pointEquals(
                {
                    x: this.tile.tileX,
                    y: this.tile.tileY,
                },
                {
                    x: job.groundTile.tileX,
                    y: job.groundTile.tileY,
                }
            );
        } else {
            return false;
        }
    }
}
