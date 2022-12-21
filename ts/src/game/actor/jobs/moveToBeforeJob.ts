import { isPointAdjacentTo, Point, pointEquals } from "../../../common/point";
import { Job } from "../job/job";
import { JobConstraint } from "../job/jobConstraint";
import { JobConstraintsError } from "../job/jobConstraintsError";
import { MultipleStepJob } from "../job/multipleStepJob";
import { MoveJob } from "./moveJob";

export interface TargetedJob {
    tileX: number;
    tileY: number;
}

export class MoveToBeforeJob extends MultipleStepJob {
    private job: Job;
    private tileSpaceTarget: Point;

    constructor(job: Job & TargetedJob, constraints: JobConstraint) {
        super(constraints);
        this.tileSpaceTarget = {
            x: job.tileX,
            y: job.tileY,
        };

        this.job = job;
    }

    override onStart(): void {
        // If the target is not adjacent to the actor we search for a path and
        // add a move job before the wrapped job
        const subJobs: Job[] = [];
        if (!isPointAdjacentTo(this.tileSpaceTarget, this.actor.tilePosition)) {
            console.log(
                `Job ${this.constructor.name} was not next to actor, adding path`
            );
            //The tile was not adjacent to us so we need to move to it first
            const pathResult = this.actor.world.findPath(
                this.actor.tilePosition,
                this.tileSpaceTarget
            );
            const path = pathResult.path;
            // The pathfinding will return the selected tile as a position to
            // walk to as well. To avoid ending on top of the tree to chop, we
            // pop the path removing the last position (position of the tree)
            if (pointEquals(this.tileSpaceTarget, path[path.length - 1])) {
                path.pop();
            }

            if (path.length == 0) {
                throw new JobConstraintsError("Unable to find path to job");
            }

            subJobs.push(new MoveJob(path));
        } else {
            console.log(
                `Job ${this.constructor.name} was adjacent to for actor`,
                this.tileSpaceTarget,
                this.actor
            );
        }

        subJobs.push(this.job);
        this.setJobs(subJobs);
    }
}
