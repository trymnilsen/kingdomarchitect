import { distance } from "../../../common/point.ts";
import { log } from "../../../common/logging/logger.ts";
import type { Entity } from "../../entity/entity.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import type { JobQueueComponent } from "../../component/jobQueueComponent.ts";
import type { Jobs } from "../../job/job.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import type { Behavior } from "./Behavior.ts";
import {
    canExecuteBuildJob,
    type BuildBuildingJob,
} from "../../job/buildBuildingJob.ts";
import {
    findJobClaimedBy,
    claimJobInQueue,
    suspendJobInQueue,
} from "../../job/jobLifecycle.ts";
import { CraftingJobId, type CraftingJob } from "../../job/craftingJob.ts";
import { WindmillJobId, type WindmillJob } from "../../job/windmillJob.ts";
import {
    ProductionJobId,
    type ProductionJob,
} from "../../job/productionJob.ts";
import { planJob } from "../../job/planner/jobPlanner.ts";
import type { BuildJobPlanner } from "../../job/planner/jobPlanner.ts";
import type { CollectResourceJob } from "../../job/collectResourceJob.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import { getResourceById } from "../../../data/inventory/items/naturalResource.ts";
import { getJobTargetPosition } from "../../job/jobQuery.ts";
import {
    RoleComponentId,
    WorkerRole,
} from "../../component/worker/roleComponent.ts";

type BuildJobValidator = (
    root: Entity,
    job: BuildBuildingJob,
    worker: Entity,
) => boolean;

/**
 * PerformJobBehavior handles job execution for entities.
 * Uses ancestor traversal to find the nearest JobQueueComponent in the
 * entity hierarchy. Player workers find the root queue, goblins find
 * their camp's queue.
 *
 * @param buildPlanner Injected planner for build jobs. Player workers
 *   use planBuildBuilding (stockpile-only), goblins use planGoblinBuildJob
 *   (gather from environment).
 * @param buildJobValidator Pre-check for build jobs. Defaults to
 *   canExecuteBuildJob (stockpile check). Pass `() => true` for goblins
 *   that gather from the environment.
 * @param claimRequiresEmptyHand When true, a worker may not claim a new job
 *   while carrying something. It must deposit its load (via DepositHeldBehavior)
 *   first. This keeps workers from grabbing more work and panic-dropping their
 *   load on the ground. Player workers opt in; goblins leave it off (default)
 *   because they have no deposit behavior and would otherwise be stranded
 *   holding gathered materials forever.
 */
export function createPerformJobBehavior(
    buildPlanner: BuildJobPlanner,
    buildJobValidator: BuildJobValidator = canExecuteBuildJob,
    claimRequiresEmptyHand: boolean = false,
): Behavior {
    return {
        name: "performJob",

        isValid(entity: Entity): boolean {
            // Guards are pure sentries: removed from the labor pool entirely, so
            // they never claim jobs. They man towers (GarrisonBehavior) instead.
            const role = entity.getEcsComponent(RoleComponentId);
            if (role?.role === WorkerRole.Guard) {
                return false;
            }

            const jobQueue =
                entity.getAncestorEcsComponent(JobQueueComponentId);

            if (!jobQueue) {
                return false;
            }

            // Valid if has claimed job
            const hasClaimedJob = jobQueue.jobs.some(
                (job) => job.claimedBy === entity.id,
            );
            if (hasClaimedJob) {
                return true;
            }

            // Valid if there are unclaimed jobs we can take
            return hasAvailableJobs(
                entity,
                jobQueue,
                buildJobValidator,
                claimRequiresEmptyHand,
            );
        },

        utility(_entity: Entity): number {
            return 50;
        },

        expand(entity: Entity): BehaviorActionData[] {
            const root = entity.getRootEntity();
            const queueEntity = entity.getAncestorEntity(JobQueueComponentId);

            if (!queueEntity) {
                return [];
            }

            const jobQueue = queueEntity.getEcsComponent(JobQueueComponentId);

            if (!jobQueue) {
                log.debug(
                    `[PerformJobBehavior] entity ${entity.id} had no job queue`,
                );
                return [];
            }

            // A job claimed on a previous tick is resumed first. If it no
            // longer plans to anything, release the claim so the job stops
            // being hidden from other workers, then look for different work
            // below. Holding the claim while idling would livelock this worker
            // on the same dead job and starve everyone else of it.
            const claimedJob = findJobClaimedBy(queueEntity, entity.id);
            if (claimedJob) {
                log.debug(
                    `[PerformJobBehavior] entity ${entity.id} had claimed job ${claimedJob.id}`,
                    claimedJob,
                );
                const actions = planJob(root, entity, claimedJob, buildPlanner);
                if (actions.length > 0) {
                    log.info(
                        `[PerformJobBehavior] entity ${entity.id} planned actions`,
                        actions,
                    );
                    return actions;
                }
                releaseClaimIfHeld(
                    queueEntity,
                    jobQueue,
                    claimedJob,
                    entity.id,
                );
            }

            return claimNextPlannableJob(
                root,
                entity,
                queueEntity,
                jobQueue,
                buildPlanner,
                buildJobValidator,
                claimRequiresEmptyHand,
                claimedJob,
            );
        },
    };
}

/**
 * Release `entityId`'s claim on `job`, but only if the job is still in the
 * queue and still claimed by this entity. Planners retire or suspend jobs as a
 * side effect of planning (failAndAbort splices the job out, suspendJob
 * releases the claim), so by the time a plan comes back empty the claim may
 * already be gone. Releasing unconditionally would clobber another worker's
 * claim or resurrect a removed job's bookkeeping.
 */
function releaseClaimIfHeld(
    queueEntity: Entity,
    jobQueue: JobQueueComponent,
    job: Jobs,
    entityId: string,
): void {
    if (job.claimedBy === entityId && jobQueue.jobs.includes(job)) {
        suspendJobInQueue(queueEntity, job);
    }
}

/**
 * Walk takeable jobs from cheapest to most expensive and claim the first one
 * that plans to a non-empty action list.
 *
 * Trying candidates in order instead of committing to the single cheapest one
 * is what keeps one unplannable job from starving the whole queue: the
 * take-check (canTakeJob) is deliberately cheap and cannot know everything the
 * planner knows (e.g. whether a recipe input has any source in the world), so
 * a job can pass it and still plan to nothing. Before this loop, every worker
 * would pick that same job, fail to plan it, idle, and repeat next tick while
 * plannable jobs sat behind it in the queue.
 *
 * Candidates are collected as references before any planning happens because
 * planners mutate the queue mid-loop: failAndAbort splices jobs out and
 * suspendJob releases claims. Each candidate is re-validated right before the
 * attempt for the same reason. An empty plan releases the claim explicitly,
 * because several planner paths return empty without releasing it themselves.
 * A worker that walks off to other work while holding a dead claim hides that
 * job from every worker permanently.
 *
 * @param skipJob A job that already failed to plan this tick (the resumed
 *   claimed job), excluded so it isn't planned twice in one selection.
 */
function claimNextPlannableJob(
    root: Entity,
    worker: Entity,
    queueEntity: Entity,
    jobQueue: JobQueueComponent,
    buildPlanner: BuildJobPlanner,
    buildJobValidator: BuildJobValidator,
    claimRequiresEmptyHand: boolean,
    skipJob: Jobs | null,
): BehaviorActionData[] {
    // Cost combines distance and queue position so workers prefer nearby jobs
    // but still respect rough priority order (earlier jobs score lower queue
    // cost). baseCost provides a floor so a job at distance 0 doesn't get an
    // unfair advantage purely from its index relative to other close-by jobs.
    const baseCost = 10;
    const candidates: { job: Jobs; cost: number }[] = [];
    for (let i = 0; i < jobQueue.jobs.length; i++) {
        const job = jobQueue.jobs[i];
        if (job === skipJob) {
            continue;
        }
        if (
            !canTakeJob(
                root,
                worker,
                job,
                jobQueue,
                buildJobValidator,
                claimRequiresEmptyHand,
            )
        ) {
            continue;
        }
        const targetPosition = getJobTargetPosition(root, job);
        if (!targetPosition) {
            continue;
        }
        const cost =
            baseCost + distance(worker.worldPosition, targetPosition) + i;
        candidates.push({ job, cost });
    }
    candidates.sort((a, b) => a.cost - b.cost);

    for (const candidate of candidates) {
        const job = candidate.job;
        // An earlier candidate's planner may have retired this job or another
        // worker's bookkeeping may have changed it; skip anything that is no
        // longer freely claimable.
        if (job.claimedBy !== undefined || !jobQueue.jobs.includes(job)) {
            continue;
        }

        log.debug(`[PerformJobBehavior] entity ${worker.id} claiming job`, job);
        claimJobInQueue(job, worker.id, queueEntity);
        const actions = planJob(root, worker, job, buildPlanner);
        if (actions.length > 0) {
            log.info(
                `[PerformJobBehavior] entity ${worker.id} planned actions`,
                actions,
            );
            return actions;
        }
        releaseClaimIfHeld(queueEntity, jobQueue, job, worker.id);
    }

    log.debug(
        `[PerformJobBehavior] entity ${worker.id} had no plannable jobs, returning []`,
    );
    return [];
}

/**
 * Single source of truth for "can this worker take this job right now". Used by
 * both isValid() (via hasAvailableJobs) and expand() (via claimNextPlannableJob)
 * so the two can never disagree. This check is deliberately cheap and cannot
 * know everything the planners know, so a job passing it can still plan to
 * nothing; expand() handles that by trying the next candidate, and the behavior
 * system falls through to a lower-utility behavior if no job plans at all.
 *
 * The target-position check comes first so a stale job, one whose target entity
 * was removed while the job stayed queued, is rejected before reaching a
 * type-specific validator that assumes the target exists.
 *
 * buildJobValidator is injected because goblins gather from the environment and
 * pass `() => true` to bypass the stockpile pre-check player workers rely on.
 *
 * claimRequiresEmptyHand blocks claiming any new job while the worker is
 * carrying something, so it deposits its load before taking more work rather
 * than panic-dropping it. If the held item is one no stockpile accepts the
 * worker idles holding it (DepositHeldBehavior is also invalid); that is
 * acceptable, since the eat behavior's deposit-or-drop clears the hand if it ever
 * matters, and idling beats littering.
 */
function canTakeJob(
    root: Entity,
    entity: Entity,
    job: Jobs,
    jobQueue: JobQueueComponent,
    buildJobValidator: BuildJobValidator,
    claimRequiresEmptyHand: boolean,
): boolean {
    if (job.claimedBy !== undefined) {
        return false;
    }

    if (claimRequiresEmptyHand) {
        const held = entity.getEcsComponent(HeldItemComponentId);
        if (held && !isHeldEmpty(held)) {
            return false;
        }
    }

    if (
        job.constraint &&
        job.constraint.type === "entity" &&
        job.constraint.id !== entity.id
    ) {
        return false;
    }

    if (getJobTargetPosition(root, job) === null) {
        return false;
    }

    return canExecuteJob(root, job, entity, buildJobValidator, jobQueue);
}

/**
 * Check if there is any job this worker can take right now.
 */
function hasAvailableJobs(
    entity: Entity,
    jobQueue: JobQueueComponent,
    buildJobValidator: BuildJobValidator,
    claimRequiresEmptyHand: boolean,
): boolean {
    const root = entity.getRootEntity();
    return jobQueue.jobs.some((job) =>
        canTakeJob(
            root,
            entity,
            job,
            jobQueue,
            buildJobValidator,
            claimRequiresEmptyHand,
        ),
    );
}

/**
 * Check if a job can be executed by a worker.
 * Returns false if the job has prerequisites that aren't met.
 */
function canExecuteJob(
    root: Entity,
    job: Jobs,
    workerEntity: Entity,
    buildJobValidator: BuildJobValidator,
    jobQueue: JobQueueComponent,
): boolean {
    switch (job.id) {
        case "buildBuildingJob":
            return buildJobValidator(
                root,
                job as BuildBuildingJob,
                workerEntity,
            );
        case "collectResource":
            return canHeldAcceptResourceYield(
                root,
                job as CollectResourceJob,
                workerEntity,
            );
        case "craftingJob":
            return canExecuteCraftingJob(jobQueue, job as CraftingJob);
        case "windmillJob":
            return canExecuteWindmillJob(jobQueue, job as WindmillJob);
        case "productionJob":
            return canExecuteProductionJob(jobQueue, job as ProductionJob);
        default:
            return true;
    }
}

/**
 * Reject collect-resource jobs when the worker is already carrying
 * something incompatible with the resource's yield. Without this guard
 * the worker would walk to the tree, swing for several ticks, then fail
 * at the deposit step with full progress wasted.
 */
function canHeldAcceptResourceYield(
    root: Entity,
    job: CollectResourceJob,
    worker: Entity,
): boolean {
    const held = worker.getEcsComponent(HeldItemComponentId);
    if (!held || isHeldEmpty(held)) return true;

    const resourceEntity = root.findEntity(job.entityId);
    if (!resourceEntity) return false;

    const resourceComponent =
        resourceEntity.getEcsComponent(ResourceComponentId);
    if (!resourceComponent) return false;

    const resource = getResourceById(resourceComponent.resourceId);
    if (!resource) return false;

    const heldId = held.item!.id;
    return resource.yields.every((y) => y.item.id === heldId);
}

/**
 * Reject crafting jobs when another worker has already claimed a crafting job
 * at the same building. Only one worker can use a crafting station at a time.
 */
function canExecuteCraftingJob(
    jobQueue: JobQueueComponent,
    job: CraftingJob,
): boolean {
    return !jobQueue.jobs.some(
        (j) =>
            j.claimedBy !== undefined &&
            j.id === CraftingJobId &&
            (j as CraftingJob).targetBuilding === job.targetBuilding,
    );
}

/**
 * Reject windmill jobs when another worker has already claimed a windmill job
 * at the same building. Only one worker can operate a windmill at a time.
 */
function canExecuteWindmillJob(
    jobQueue: JobQueueComponent,
    job: WindmillJob,
): boolean {
    return !jobQueue.jobs.some(
        (j) =>
            j.claimedBy !== undefined &&
            j.id === WindmillJobId &&
            (j as WindmillJob).targetBuilding === job.targetBuilding,
    );
}

/**
 * Reject production jobs when another worker has already claimed a production job
 * at the same building. Only one worker can operate a production facility at a time.
 */
function canExecuteProductionJob(
    jobQueue: JobQueueComponent,
    job: ProductionJob,
): boolean {
    return !jobQueue.jobs.some(
        (j) =>
            j.claimedBy !== undefined &&
            j.id === ProductionJobId &&
            (j as ProductionJob).targetBuilding === job.targetBuilding,
    );
}
