import type { Point } from "../../common/point.ts";
import { JobRunnerComponentId } from "../component/jobRunnerComponent.ts";
import type { Entity } from "../entity/entity.ts";
import type { AttackJob } from "./attackJob.ts";
import type { BuildBuildingJob } from "./buildBuildingJob.ts";
import type { CollectItemJob } from "./collectItemJob.ts";
import type { CollectResourceJob } from "./collectResourceJob.ts";
import type { MoveToJob } from "./moveToPointJob.ts";

export type JobConstraint = EntityJobConstraint;
export interface EntityJobConstraint {
    type: "entity";
    id: string;
}

export interface Job {
    id: JobId;
    claimedBy?: string;
    constraint?: JobConstraint;
}

export type Jobs =
    | MoveToJob
    | BuildBuildingJob
    | AttackJob
    | CollectItemJob
    | CollectResourceJob;
export type JobId = Jobs["id"];
export type JobHandler<T extends Job> = (
    scene: Entity,
    root: Entity,
    entity: Entity,
    job: T,
    tick: number,
) => void;

export function completeJob(entity: Entity) {
    const runner = entity.requireEcsComponent(JobRunnerComponentId);
    console.log("Completing job", runner.currentJob);
    runner.currentJob = null;
    entity.invalidateComponent(JobRunnerComponentId);
}

export function isTargetOfJob(job: Jobs, entity: Entity): boolean {
    switch (job.id) {
        case "attackJob":
            return job.target == entity.id;
        case "buildBuildingJob":
            return job.entityId == entity.id;
        case "chopTreeJob":
            return job.entityId == entity.id;
        case "collectItem":
            return job.entityId == entity.id;
        case "moveToJob":
            return false;
    }
}

export function endPosition(job: Jobs): Point {}
