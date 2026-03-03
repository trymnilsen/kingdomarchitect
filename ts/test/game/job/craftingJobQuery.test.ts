import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    createJobQueueComponent,
    addJob,
} from "../../../src/game/component/jobQueueComponent.ts";
import {
    createBehaviorAgentComponent,
    BehaviorAgentComponentId,
} from "../../../src/game/component/BehaviorAgentComponent.ts";
import { createCraftingJob } from "../../../src/game/job/craftingJob.ts";
import {
    getCraftingJobsForBuilding,
    getCraftingJobProgress,
    cancelCraftingJob,
    clearUnclaimedCraftingJobs,
} from "../../../src/game/job/craftingJobQuery.ts";
import { planksRecipe } from "../../../src/data/crafting/recipes/carpenterRecipes.ts";

function createTestScene(): { root: Entity; building: Entity } {
    const root = new Entity("root-5");
    const building = new Entity("building-42");

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(building);

    return { root, building };
}

describe("craftingJobQuery", () => {
    describe("getCraftingJobsForBuilding", () => {
        it("returns empty array when no crafting jobs exist", () => {
            const { building } = createTestScene();

            const jobs = getCraftingJobsForBuilding(building);

            assert.strictEqual(jobs.length, 0);
        });

        it("returns jobs targeting the building", () => {
            const { root, building } = createTestScene();

            const queue = root.getEcsComponent("JobQueue")!;
            addJob(queue, createCraftingJob("building-42", planksRecipe));
            addJob(queue, createCraftingJob("building-42", planksRecipe));

            const jobs = getCraftingJobsForBuilding(building);

            assert.strictEqual(jobs.length, 2);
        });

        it("does not return jobs for other buildings", () => {
            const { root, building } = createTestScene();

            const queue = root.getEcsComponent("JobQueue")!;
            addJob(queue, createCraftingJob("other-building-9", planksRecipe));
            addJob(queue, createCraftingJob("building-42", planksRecipe));

            const jobs = getCraftingJobsForBuilding(building);

            assert.strictEqual(jobs.length, 1);
            assert.strictEqual(jobs[0].targetBuilding, "building-42");
        });

        it("lists claimed jobs before unclaimed", () => {
            const { root, building } = createTestScene();

            const queue = root.getEcsComponent("JobQueue")!;
            const unclaimed = createCraftingJob("building-42", planksRecipe);
            const claimed = createCraftingJob("building-42", planksRecipe);
            claimed.claimedBy = "worker-7";

            addJob(queue, unclaimed);
            addJob(queue, claimed);

            const jobs = getCraftingJobsForBuilding(building);

            assert.strictEqual(jobs.length, 2);
            assert.strictEqual(jobs[0].claimedBy, "worker-7");
            assert.strictEqual(jobs[1].claimedBy, undefined);
        });
    });

    describe("getCraftingJobProgress", () => {
        it("returns 0 for unclaimed job", () => {
            const { root } = createTestScene();

            const job = createCraftingJob("building-42", planksRecipe);

            assert.strictEqual(getCraftingJobProgress(root, job), 0);
        });

        it("returns 0 when worker entity not found", () => {
            const { root } = createTestScene();

            const job = createCraftingJob("building-42", planksRecipe);
            job.claimedBy = "missing-worker-99";

            assert.strictEqual(getCraftingJobProgress(root, job), 0);
        });

        it("returns 0 when worker has no matching craftItem action", () => {
            const { root } = createTestScene();

            const worker = new Entity("worker-7");
            worker.setEcsComponent(createBehaviorAgentComponent());
            root.addChild(worker);

            const job = createCraftingJob("building-42", planksRecipe);
            job.claimedBy = "worker-7";

            assert.strictEqual(getCraftingJobProgress(root, job), 0);
        });

        it("returns progress from worker's craftItem action", () => {
            const { root } = createTestScene();

            const worker = new Entity("worker-7");
            const agent = createBehaviorAgentComponent();
            agent.actionQueue.push({
                type: "craftItem",
                buildingId: "building-42",
                recipe: planksRecipe,
                progress: 2,
                inputsConsumed: true,
            });
            worker.setEcsComponent(agent);
            root.addChild(worker);

            const job = createCraftingJob("building-42", planksRecipe);
            job.claimedBy = "worker-7";

            assert.strictEqual(getCraftingJobProgress(root, job), 2);
        });

        it("returns 0 when craftItem action has no progress yet", () => {
            const { root } = createTestScene();

            const worker = new Entity("worker-7");
            const agent = createBehaviorAgentComponent();
            agent.actionQueue.push({
                type: "craftItem",
                buildingId: "building-42",
                recipe: planksRecipe,
            });
            worker.setEcsComponent(agent);
            root.addChild(worker);

            const job = createCraftingJob("building-42", planksRecipe);
            job.claimedBy = "worker-7";

            assert.strictEqual(getCraftingJobProgress(root, job), 0);
        });
    });

    describe("cancelCraftingJob", () => {
        it("removes the first unclaimed matching job (FIFO)", () => {
            const { root, building } = createTestScene();

            const queue = root.getEcsComponent("JobQueue")!;
            const job1 = createCraftingJob("building-42", planksRecipe);
            const job2 = createCraftingJob("building-42", planksRecipe);
            addJob(queue, job1);
            addJob(queue, job2);

            const result = cancelCraftingJob(
                root,
                "building-42",
                planksRecipe.id,
            );

            assert.strictEqual(result, true);
            assert.strictEqual(queue.jobs.length, 1);
            assert.strictEqual(queue.jobs[0], job2);
        });

        it("returns false when no matching unclaimed job exists", () => {
            const { root } = createTestScene();

            const result = cancelCraftingJob(
                root,
                "building-42",
                planksRecipe.id,
            );

            assert.strictEqual(result, false);
        });

        it("does not remove claimed jobs", () => {
            const { root } = createTestScene();

            const queue = root.getEcsComponent("JobQueue")!;
            const job = createCraftingJob("building-42", planksRecipe);
            job.claimedBy = "worker-7";
            addJob(queue, job);

            const result = cancelCraftingJob(
                root,
                "building-42",
                planksRecipe.id,
            );

            assert.strictEqual(result, false);
            assert.strictEqual(queue.jobs.length, 1);
        });

        it("removes only one job when multiple unclaimed match (FIFO)", () => {
            const { root } = createTestScene();

            const queue = root.getEcsComponent("JobQueue")!;
            addJob(queue, createCraftingJob("building-42", planksRecipe));
            addJob(queue, createCraftingJob("building-42", planksRecipe));
            addJob(queue, createCraftingJob("building-42", planksRecipe));

            cancelCraftingJob(root, "building-42", planksRecipe.id);

            assert.strictEqual(queue.jobs.length, 2);
        });

        it("does not affect jobs for other buildings", () => {
            const { root } = createTestScene();

            const queue = root.getEcsComponent("JobQueue")!;
            addJob(queue, createCraftingJob("other-99", planksRecipe));
            addJob(queue, createCraftingJob("building-42", planksRecipe));

            cancelCraftingJob(root, "building-42", planksRecipe.id);

            assert.strictEqual(queue.jobs.length, 1);
            assert.strictEqual(
                (queue.jobs[0] as { targetBuilding: string }).targetBuilding,
                "other-99",
            );
        });
    });

    describe("clearUnclaimedCraftingJobs", () => {
        it("removes all unclaimed crafting jobs for the building", () => {
            const { root } = createTestScene();

            const queue = root.getEcsComponent("JobQueue")!;
            addJob(queue, createCraftingJob("building-42", planksRecipe));
            addJob(queue, createCraftingJob("building-42", planksRecipe));
            addJob(queue, createCraftingJob("building-42", planksRecipe));

            const removed = clearUnclaimedCraftingJobs(root, "building-42");

            assert.strictEqual(removed, 3);
            assert.strictEqual(queue.jobs.length, 0);
        });

        it("keeps claimed jobs", () => {
            const { root } = createTestScene();

            const queue = root.getEcsComponent("JobQueue")!;
            const claimed = createCraftingJob("building-42", planksRecipe);
            claimed.claimedBy = "worker-7";
            addJob(queue, claimed);
            addJob(queue, createCraftingJob("building-42", planksRecipe));

            const removed = clearUnclaimedCraftingJobs(root, "building-42");

            assert.strictEqual(removed, 1);
            assert.strictEqual(queue.jobs.length, 1);
            assert.strictEqual(queue.jobs[0].claimedBy, "worker-7");
        });

        it("does not remove jobs for other buildings", () => {
            const { root } = createTestScene();

            const queue = root.getEcsComponent("JobQueue")!;
            addJob(queue, createCraftingJob("other-99", planksRecipe));
            addJob(queue, createCraftingJob("building-42", planksRecipe));

            clearUnclaimedCraftingJobs(root, "building-42");

            assert.strictEqual(queue.jobs.length, 1);
            assert.strictEqual(
                (queue.jobs[0] as { targetBuilding: string }).targetBuilding,
                "other-99",
            );
        });

        it("returns 0 when no matching unclaimed jobs exist", () => {
            const { root } = createTestScene();

            const removed = clearUnclaimedCraftingJobs(root, "building-42");

            assert.strictEqual(removed, 0);
        });
    });
});
