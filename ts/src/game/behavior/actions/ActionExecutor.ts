import { Entity } from "../../entity/entity.ts";
import type {
    ActionStatus,
    BehaviorActionData,
    BehaviorActionExecutor,
} from "./Action.ts";
import { pointEquals } from "../../../common/point.ts";
import { doMovement, MovementResult } from "../../job/movementHelper.ts";
import { getBehaviorAgent } from "../components/BehaviorAgentComponent.ts";
import {
    JobRunnerComponentId,
} from "../../component/jobRunnerComponent.ts";
import {
    JobQueueComponentId,
} from "../../component/jobQueueComponent.ts";
import { claimJob } from "../../job/job.ts";
import { getJobHandler } from "../../job/jobHandlers.ts";
import { EnergyComponentId } from "../../component/energyComponent.ts";

/**
 * Main action executor that dispatches to specific action handlers based on action type.
 */
export const executeAction: BehaviorActionExecutor = (
    action: BehaviorActionData,
    entity: Entity,
    tick: number,
): ActionStatus => {
    switch (action.type) {
        case "wait":
            return executeWaitAction(action, entity, tick);
        case "moveTo":
            return executeMoveToAction(action, entity);
        case "playerMove":
            return executePlayerMoveAction(action, entity);
        case "claimJob":
            return executeClaimJobAction(action, entity);
        case "executeJob":
            return executeExecuteJobAction(entity, tick);
        case "sleep":
            return executeSleepAction(entity);
        default:
            console.warn(
                `[ActionExecutor] Unknown action type: ${(action as any).type}`,
            );
            return "failed";
    }
};

/**
 * Wait until a specific tick time.
 */
function executeWaitAction(
    action: Extract<BehaviorActionData, { type: "wait" }>,
    _entity: Entity,
    tick: number,
): ActionStatus {
    if (tick >= action.until) {
        return "complete";
    }

    return "running";
}

/**
 * Move to a target position (general movement).
 */
function executeMoveToAction(
    action: Extract<BehaviorActionData, { type: "moveTo" }>,
    entity: Entity,
): ActionStatus {
    if (pointEquals(entity.worldPosition, action.target)) {
        return "complete";
    }

    const result = doMovement(entity, action.target);

    if (result === MovementResult.Failure) {
        return "failed";
    }

    if (pointEquals(entity.worldPosition, action.target)) {
        return "complete";
    }

    return "running";
}

/**
 * Move to a target position for a player command.
 * Clears the player command when complete or failed.
 */
function executePlayerMoveAction(
    action: Extract<BehaviorActionData, { type: "playerMove" }>,
    entity: Entity,
): ActionStatus {
    if (pointEquals(entity.worldPosition, action.target)) {
        const agent = getBehaviorAgent(entity);
        if (agent) {
            agent.playerCommand = undefined;
            entity.invalidateComponent("behavioragent");
        }
        console.log(
            `[PlayerMoveAction] Entity ${entity.id} reached target at ${action.target.x},${action.target.y}`,
        );
        return "complete";
    }

    const result = doMovement(entity, action.target);

    if (result === MovementResult.Failure) {
        console.warn(
            `[PlayerMoveAction] Entity ${entity.id} cannot reach target at ${action.target.x},${action.target.y}`,
        );
        const agent = getBehaviorAgent(entity);
        if (agent) {
            agent.playerCommand = undefined;
            entity.invalidateComponent("behavioragent");
        }
        return "failed";
    }

    if (pointEquals(entity.worldPosition, action.target)) {
        const agent = getBehaviorAgent(entity);
        if (agent) {
            agent.playerCommand = undefined;
            entity.invalidateComponent("behavioragent");
        }
        console.log(
            `[PlayerMoveAction] Entity ${entity.id} reached target at ${action.target.x},${action.target.y}`,
        );
        return "complete";
    }

    return "running";
}

/**
 * Claim a job from the queue.
 */
function executeClaimJobAction(
    action: Extract<BehaviorActionData, { type: "claimJob" }>,
    entity: Entity,
): ActionStatus {
    const root = entity.getRootEntity();
    const runner = entity.getEcsComponent(JobRunnerComponentId);
    const jobQueue = root.getEcsComponent(JobQueueComponentId);

    if (!runner) {
        console.warn(
            `[ClaimJobAction] Entity ${entity.id} has no JobRunnerComponent`,
        );
        return "failed";
    }

    if (!jobQueue) {
        console.warn(`[ClaimJobAction] No job queue found on root entity`);
        return "failed";
    }

    const job = jobQueue.jobs[action.jobIndex];
    if (!job) {
        console.warn(
            `[ClaimJobAction] Job at index ${action.jobIndex} not found`,
        );
        return "failed";
    }

    // Check if job is already claimed by another worker
    if (job.state === "claimed" && job.claimedBy !== entity.id) {
        console.warn(
            `[ClaimJobAction] Job ${job.id} is already claimed by ${job.claimedBy}`,
        );
        return "failed";
    }

    claimJob(job, entity.id);
    runner.currentJob = job;
    entity.invalidateComponent(JobRunnerComponentId);
    root.invalidateComponent(JobQueueComponentId);

    console.log(
        `[ClaimJobAction] Entity ${entity.id} claimed job ${action.jobIndex} (${job.id})`,
    );

    return "complete";
}

/**
 * Execute the current job using the job handler system.
 */
function executeExecuteJobAction(entity: Entity, tick: number): ActionStatus {
    const root = entity.getRootEntity();
    const runner = entity.getEcsComponent(JobRunnerComponentId);

    if (!runner || !runner.currentJob) {
        console.warn(
            `[ExecuteJobAction] Entity ${entity.id} has no current job`,
        );
        return "failed";
    }

    const job = runner.currentJob;
    const handler = getJobHandler(job.id);

    if (!handler) {
        console.warn(
            `[ExecuteJobAction] No handler found for job type ${job.id}`,
        );
        return "failed";
    }

    try {
        handler(root, entity, job, tick);
    } catch (error) {
        console.error(
            `[ExecuteJobAction] Error executing job ${job.id}:`,
            error,
        );
        return "failed";
    }

    // Check if job is complete (handler sets currentJob to null when done)
    if (!runner.currentJob) {
        return "complete";
    }

    return "running";
}

/**
 * Sleep action - recovers energy over time.
 */
function executeSleepAction(entity: Entity): ActionStatus {
    const energy = entity.getEcsComponent(EnergyComponentId);

    if (!energy) {
        console.warn(
            `[SleepAction] Entity ${entity.id} has no energy component`,
        );
        return "failed";
    }

    // Recover energy using the configured restore rate
    energy.energy = Math.min(100, energy.energy + energy.restoreRate);
    entity.invalidateComponent(EnergyComponentId);

    // Stop sleeping when energy is at or above 100
    if (energy.energy >= 100) {
        console.log(`[SleepAction] Entity ${entity.id} is fully rested`);
        return "complete";
    }

    return "running";
}
