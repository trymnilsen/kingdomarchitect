import { GoapAgentComponentId } from "../../../component/goapAgentComponent.ts";
import { JobQueueComponentId } from "../../../component/jobQueueComponent.ts";
import { entityWithId } from "../../../entity/child/withId.ts";
import { isJobClaimed } from "../../../job/job.ts";
import type { GoapGoalDefinition } from "../../../goap/goapGoal.ts";
import { getState } from "../../../goap/goapWorldState.ts";

/**
 * Be productive goal - worker should claim and complete jobs from the queue.
 * This goal drives workers to execute player-commanded tasks.
 */
export const beProductiveGoal: GoapGoalDefinition = {
    id: "be_productive",
    name: "Work job",
    priority: () => 20, // Fixed priority - work is important but can be overridden by critical needs

    isValid: (ctx) => {
        // Goal is valid if there are any unclaimed jobs in the queue
        // or if the agent has already claimed a job
        const jobQueue = ctx.root.getEcsComponent(JobQueueComponentId);

        if (!jobQueue) {
            return false;
        }

        // Check if agent has a claimed job
        const goapAgent = ctx.agent.getEcsComponent(GoapAgentComponentId);
        if (goapAgent?.claimedJob !== undefined) {
            return true; // Valid if we have a claimed job to work on
        }

        // Valid if there are unclaimed jobs available
        const hasUnclaimedJobs = jobQueue.jobs.some((job) => !isJobClaimed(job));
        return hasUnclaimedJobs;
    },

    isSatisfied: (_ctx) => {
        // This goal is never truly "satisfied" in the runtime sense.
        // If there are jobs available, the goal is valid and unsatisfied (we should work).
        // If there are no jobs, the goal becomes invalid (not satisfied).
        // This keeps workers continuously working on available jobs.
        return false;
    },

    wouldBeSatisfiedBy: (state, _ctx) => {
        // In the simulated world state during planning:
        // The goal is satisfied when we've COMPLETED a job.
        //
        // We use a sentinel value "__COMPLETE__" to distinguish between:
        // - undefined/missing: never had a job (start state)
        // - "0", "1", etc: currently working on a job
        // - "__COMPLETE__": just finished a job (goal satisfied)
        //
        // This creates two-step plans:
        // 1. claim_job_0 (sets claimedJob="0")
        // 2. collect_resource (sets claimedJob="__COMPLETE__") -> goal satisfied!
        const claimedJob = getState(state, "claimedJob");
        return claimedJob === "__COMPLETE__"; // Satisfied when job is complete
    },
};
