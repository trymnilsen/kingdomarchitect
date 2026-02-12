import { Entity } from "../../../src/game/entity/entity.ts";
import { createBehaviorAgentComponent } from "../../../src/game/component/BehaviorAgentComponent.ts";
import { createEnergyComponent } from "../../../src/game/component/energyComponent.ts";
import {
    createJobRunnerComponent,
    JobRunnerComponentId,
} from "../../../src/game/component/jobRunnerComponent.ts";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../../../src/game/component/jobQueueComponent.ts";
import type { Jobs } from "../../../src/game/job/job.ts";
import { ResourceHarvestMode } from "../../../src/data/inventory/items/naturalResource.ts";

/**
 * Create a minimal test entity with required components for behavior testing.
 */
export function createTestEntity(
    id: string = "test-entity",
    x: number = 0,
    y: number = 0,
): Entity {
    const entity = new Entity(id);
    entity.worldPosition = { x, y };
    return entity;
}

/**
 * Create a test entity with behavior agent component.
 */
export function createBehaviorTestEntity(
    id: string = "test-entity",
    x: number = 0,
    y: number = 0,
): Entity {
    const entity = createTestEntity(id, x, y);
    entity.setEcsComponent(createBehaviorAgentComponent());
    return entity;
}

/**
 * Create a test entity with energy component.
 */
export function createEntityWithEnergy(
    id: string = "test-entity",
    energy: number = 100,
): Entity {
    const entity = createBehaviorTestEntity(id);
    const energyComponent = createEnergyComponent();
    energyComponent.energy = energy;
    entity.setEcsComponent(energyComponent);
    return entity;
}

/**
 * Create a test entity with job runner component.
 */
export function createEntityWithJobRunner(id: string = "test-entity"): Entity {
    const entity = createBehaviorTestEntity(id);
    entity.setEcsComponent(createJobRunnerComponent());
    return entity;
}

/**
 * Create a test root entity with job queue.
 */
export function createRootWithJobQueue(jobs: Jobs[] = []): Entity {
    const root = new Entity("root");
    const jobQueue = createJobQueueComponent();
    jobQueue.jobs = jobs;
    root.setEcsComponent(jobQueue);
    return root;
}

/**
 * Setup a complete test scene with root and worker entity.
 */
export function createTestScene(): {
    root: Entity;
    worker: Entity;
} {
    const root = createRootWithJobQueue();
    const worker = createEntityWithJobRunner("worker");
    root.addChild(worker);
    return { root, worker };
}

/**
 * Create a test job with default values.
 */
export function createTestJob(
    id: "collectResource" = "collectResource",
    entityId: string = "resource-1",
): Extract<Jobs, { id: "collectResource" }> {
    return {
        id,
        entityId,
        state: "queued",
        harvestAction: ResourceHarvestMode.Pick,
        workProgress: 0,
    };
}
