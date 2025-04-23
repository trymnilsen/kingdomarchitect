import type { Point } from "../../common/point.js";

export interface Job {
    id: string;
}

export interface MoveToJob extends Job {
    position: Point;
    id: typeof MoveToJobId;
}

export const MoveToJobId = "moveToJob";

export type Jobs = MoveToJob;
