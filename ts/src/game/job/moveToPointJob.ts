import {
    isPointAdjacentTo,
    pointEquals,
    type Point,
} from "../../common/point.js";
import { getWeightAtPoint } from "../map/path/graph/weight.js";
import { PathResultStatus, queryPath } from "../map/query/pathQuery.js";
import { JobRunnerComponentId } from "../component/jobRunnerComponent.js";
import { completeJob, type Job, type JobHandler } from "./job.js";
import { VisibilityComponentId } from "../component/visibilityComponent.js";
import { offsetPatternWithPoint } from "../../common/pattern.js";
import { setDiscoveryForPlayer } from "../system/worldGenerationSystem.js";
import type { Entity } from "../entity/entity.js";
import {
    DirectionComponentId,
    updateDirectionComponent,
} from "../component/directionComponent.js";
import { discoverAfterMovement } from "./movementHelper.js";
import { getPathfindingGraphForEntity } from "../map/path/getPathfindingGraphForEntity.js";

export interface MoveToJob extends Job {
    position: Point;
    path: Point[];
    id: typeof MoveToJobId;
}

export function MoveToJob(position: Point): MoveToJob {
    return {
        id: MoveToJobId,
        path: [],
        position,
    };
}

export const MoveToJobId = "moveToJob";

export const moveToJobHandler: JobHandler<MoveToJob> = (root, runner, job) => {
    //Sanity check for if we are on top of the position
    if (pointEquals(job.position, runner.worldPosition)) {
        completeJob(runner);
    }

    let nextPoint = job.path.shift();

    if (!nextPoint) {
        //Check if we are adjacent to the final point
        if (isPointAdjacentTo(job.position, runner.worldPosition)) {
            nextPoint = job.position;
        } else {
            //No path but not at the position, we should generate a path
            const pathfindingGraph = getPathfindingGraphForEntity(root, runner);
            if (!pathfindingGraph) {
                return;
            }

            const pathResult = queryPath(
                pathfindingGraph,
                runner.worldPosition,
                job.position,
            );

            if (
                pathResult.status == PathResultStatus.Complete &&
                pathResult.path.length > 0
            ) {
                job.path = pathResult.path;
                //Send a invalidate event so that the component will be in sync
                runner.invalidateComponent(JobRunnerComponentId);
                nextPoint = job.path.shift();
            }
        }
    }

    //Check if the next point is free
    if (!!nextPoint) {
        const weight = getWeightAtPoint(nextPoint, root);
        //TODO: when extracting, provide this as a function?
        console.log("MoveToJob - next point weight: ", weight);
        if (weight >= 30) {
            //Setting to undefined will finish the job down the line
            nextPoint = undefined;
        }
    }

    if (!nextPoint) {
        //We got here there is no option to keep moving
        console.log("NextPoint not defined, completing job");
        completeJob(runner);
        return;
    }

    console.log("MoveToJob", runner, nextPoint);
    discoverAfterMovement(runner, nextPoint);
    runner.updateComponent(DirectionComponentId, (component) => {
        updateDirectionComponent(component, runner.worldPosition, nextPoint);
    });

    runner.worldPosition = nextPoint;

    //If we happen to be at the end now, we dont need to wait for next
    //tick to finish
    if (pointEquals(runner.worldPosition, job.position)) {
        completeJob(runner);
    }
};
