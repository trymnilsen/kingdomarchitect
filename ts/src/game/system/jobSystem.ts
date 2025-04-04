import { EcsSystem } from "../../module/ecs/ecsSystem.js";
import type { EcsWorld } from "../../module/ecs/ecsWorld.js";
import { JobRunnerComponent } from "../component/jobRunnerComponent.js";
import { Entity } from "../entity/entity.js";

export const JobSystem: EcsSystem = {
    onUpdate: updateJobs,
};

function updateJobs(world: EcsWorld, gameTime: number) {
    const runners = world.query(JobRunnerComponent);
    for (const [entityId, component] of runners) {
        if (!!component.currentJob) {
            runJob(rootEntity, entityId, component);
        }
    }

    world.dispatch();
}

function runJob(
    rootEntity: Entity,
    entityId: string,
    component: JobRunnerComponent,
) {}
