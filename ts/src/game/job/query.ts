import { JobQueueComponentId } from "../component/jobQueueComponent.js";
import { JobRunnerComponentId } from "../component/jobRunnerComponent.js";
import type { Entity } from "../entity/entity.js";
import { isTargetOfJob, type Jobs } from "./job.js";

export function queryForJobsWithTarget(target: Entity): Jobs[] {
    const root = target.getRootEntity();
    const jobQueue = root.getEcsComponent(JobQueueComponentId);
    if (!jobQueue) {
        throw new Error("No job queue on root entity for target");
    }

    const jobs: Jobs[] = [];
    const jobsInQueue = jobQueue.jobs.filter((job) =>
        isTargetOfJob(job, target),
    );
    jobs.push(...jobsInQueue);

    const runners = root.queryComponents(JobRunnerComponentId);
    const runnerJobs = Array.from(runners.values())
        .filter(
            (runner) =>
                runner.currentJob && isTargetOfJob(runner.currentJob, target),
        )
        .map((runner) => runner.currentJob!);

    jobs.push(...runnerJobs);
    return jobs;
}
