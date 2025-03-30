import { EcsSystem } from "../../module/ecs/ecsSystem.js";
import { JobRunnerComponent } from "../component/jobRunnerComponent.js";
import { Entity } from "../entity/entity.js";

export const JobSystem: EcsSystem = {
    onUpdate: updateJobs,
};

function updateJobs(rootEntity: Entity, gameTime: number) {
    const runners: Map<string, JobRunnerComponent> =
        rootEntity.queryEcsComponents(JobRunnerComponent);
    for (const [entityId, component] of runners) {
        if (!!component.currentJob) {
            runJob(rootEntity, entityId, component);
        }
    }
}

function runJob(
    rootEntity: Entity,
    entityId: string,
    component: JobRunnerComponent,
) {}
