import { GoapAgentComponentId } from "../component/goapAgentComponent.ts";
import { JobQueueComponentId } from "../component/jobQueueComponent.ts";
import type { Entity } from "../entity/entity.ts";

/**
 * Unclaims a job from a GOAP agent and removes it from the job queue.
 * This centralizes the logic for cleaning up claimed jobs.
 *
 * @param agent The entity with the GOAP agent component
 * @param jobIndex The index of the job in the queue to remove
 */
export function unclaimJob(agent: Entity, jobIndex: number) {
    const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
    const root = agent.getRootEntity();
    const jobQueue = root.getEcsComponent(JobQueueComponentId);
    if (!jobQueue) {
        console.warn("Root has no job queue component");
        return;
    }

    // Clear the claimed job reference
    goapAgent.claimedJob = undefined;

    // Remove the job from the queue
    jobQueue.jobs.splice(jobIndex, 1);

    // Invalidate both components
    agent.invalidateComponent(GoapAgentComponentId);
    root.invalidateComponent(JobQueueComponentId);
}
