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
} from "../../../src/game/component/behaviorAgentComponent.ts";
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
    });

    describe("clearUnclaimedCraftingJobs", () => {
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
    });
});
