import { InvalidStateError } from "../../../../common/error/invalidStateError";
import {
    isPointAdjacentTo,
    Point,
    pointEquals,
} from "../../../../common/point";
import { RenderContext } from "../../../../rendering/renderContext";
import { PathFindingComponent } from "../../component/root/path/pathFindingComponent";
import { PathResultStatus } from "../../component/root/path/pathResult";
import { Job } from "../job";
import { JobConstraint } from "../jobConstraint";
import { JobConstraintsError } from "../jobConstraintsError";
import { MultipleStepJob } from "../multipleStepJob";
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
        if (
            !isPointAdjacentTo(this.tileSpaceTarget, this.entity.worldPosition)
        ) {
            //The tile was not adjacent to us so we need to move to it first
            const pathFinding =
                this.entity.getAncestorComponent(PathFindingComponent);

            if (!pathFinding) {
                throw new InvalidStateError("No pathfinding found on parent");
            }

            const pathResult = pathFinding.findPath(
                this.entity.worldPosition,
                this.tileSpaceTarget
            );
            const path = pathResult.path;
            console.log(
                `Job ${this.constructor.name} was not next to actor, adding path`,
                pathResult
            );
            if (pathResult.status == PathResultStatus.None) {
                throw new JobConstraintsError("Unable to find path to job");
            }
            // The pathfinding will return the selected tile as a position to
            // walk to as well. To avoid ending on top of the tree to chop, we
            // pop the path removing the last position (position of the tree)
            if (pointEquals(this.tileSpaceTarget, path[path.length - 1])) {
                path.pop();
            }

            subJobs.push(new MoveJob(path));
        } else {
            console.log(
                `Job ${this.constructor.name} was adjacent to for actor`,
                this.tileSpaceTarget,
                this.entity
            );
        }

        subJobs.push(this.job);
        this.setJobs(subJobs);
    }
}
