import { type Point } from "../../common/point.ts";
import type { Job } from "./job.ts";
import type { Entity } from "../entity/entity.ts";

export interface MoveToJob extends Job {
    position: Point;
    id: typeof MoveToJobId;
}

export function MoveToJob(entity: Entity, position: Point): MoveToJob {
    return {
        id: MoveToJobId,
        constraint: {
            type: "entity",
            id: entity.id,
        },
        position,
    };
}

export const MoveToJobId = "moveToJob";
