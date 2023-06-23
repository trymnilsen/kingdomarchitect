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
import { InvalidStateError } from "../../../../common/error/invalidStateError.js";
import { isPointAdjacentTo, pointEquals } from "../../../../common/point.js";
import { PathFindingComponent } from "../../component/root/path/pathFindingComponent.js";
import { PathResultStatus } from "../../component/root/path/pathResult.js";
import { JobConstraintsError } from "../jobConstraintsError.js";
import { MultipleStepJob } from "../multipleStepJob.js";
import { MoveJob } from "./moveJob.js";
export class MoveToBeforeJob extends MultipleStepJob {
    onStart() {
        // If the target is not adjacent to the actor we search for a path and
        // add a move job before the wrapped job
        const subJobs = [];
        if (!isPointAdjacentTo(this.tileSpaceTarget, this.entity.worldPosition)) {
            //The tile was not adjacent to us so we need to move to it first
            const pathFinding = this.entity.getAncestorComponent(PathFindingComponent);
            if (!pathFinding) {
                throw new InvalidStateError("No pathfinding found on parent");
            }
            const pathResult = pathFinding.findPath(this.entity.worldPosition, this.tileSpaceTarget);
            const path = pathResult.path;
            console.log(`Job ${this.constructor.name} was not next to actor, adding path`, pathResult);
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
            console.log(`Job ${this.constructor.name} was adjacent to for actor`, this.tileSpaceTarget, this.entity);
        }
        subJobs.push(this.job);
        this.setJobs(subJobs);
    }
    constructor(job, constraints){
        super(constraints);
        _define_property(this, "job", void 0);
        _define_property(this, "tileSpaceTarget", void 0);
        this.tileSpaceTarget = {
            x: job.tileX,
            y: job.tileY
        };
        this.job = job;
    }
}
