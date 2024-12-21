import { Point } from "../../../../common/point.js";
import { Job } from "../job.js";

export interface MovementJob extends Job {
    id: typeof movementJobId;
    target: Point;
    path: Point[];
}

export function makeMovementJob(target: Point, path: Point[]): MovementJob {
    return {
        id: "movement",
        target: target,
        path: path,
    };
}

export const movementJobId = "movement";
