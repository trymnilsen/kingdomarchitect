import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.ts";
import { createHealthComponent } from "../../../src/game/component/healthComponent.ts";
import { HungerComponentId } from "../../../src/game/component/hungerComponent.ts";
import { CollectResourceJob } from "../../../src/game/job/collectResourceJob.ts";
import { createCraftingJob } from "../../../src/game/job/craftingJob.ts";
import { CraftingJobId } from "../../../src/game/job/craftingJob.ts";
import { ResourceHarvestMode } from "../../../src/data/inventory/items/naturalResource.ts";
import { carpenter } from "../../../src/data/building/wood/carpenter.ts";
import { planksRecipe } from "../../../src/data/crafting/recipes/carpenterRecipes.ts";
import { JobQueueComponentId } from "../../../src/game/component/jobQueueComponent.ts";

/**
 * Regression tests for the job-selection livelock: a job can pass the cheap
 * take-check yet plan to no actions (e.g. a craft whose input has no source
 * anywhere). Selection must then move on instead of idling and retrying the
 * same dead job every tick: first to the next job in cost order, and if no
 * job plans at all, to the next valid behavior.
 */
function addTree(
    harness: ScenarioHarness,
    position: { x: number; y: number },
): Entity {
    const tree = new Entity("tree");
    tree.setEcsComponent(createResourceComponent("tree1"));
    tree.setEcsComponent(createHealthComponent(10, 10));
    harness.root.addChild(tree);
    tree.worldPosition = position;
    return tree;
}

describe("job starvation scenario tests", () => {
    it("falls through an unplannable job to a plannable one further down the queue", () => {
        /**
         * Carpenter at (11, 8) with an empty inventory, no stockpile and no
         * ground piles anywhere, so the planks craft job can never plan its
         * wood input. It sits at queue index 0 and is also the cheapest job by
         * distance for the worker at (10, 8). The tree job behind it at
         * (16, 8) is plannable. The worker must skip the dead craft job and
         * chop the tree.
         */
        const harness = new ScenarioHarness();
        const building = harness.addCraftingBuilding(
            "carpenter",
            { x: 11, y: 8 },
            carpenter,
        );
        const worker = harness.addWorker("worker", { x: 10, y: 8 });
        const tree = addTree(harness, { x: 16, y: 8 });

        harness.queueJob(createCraftingJob(building.id, planksRecipe));
        harness.queueJob(CollectResourceJob(tree, ResourceHarvestMode.Chop));

        const ticks = harness.tickUntil(
            () => harness.getHeldAmount(worker, "wood") > 0,
            60,
        );

        assert.ok(
            harness.getHeldAmount(worker, "wood") > 0,
            `worker should have chopped the tree despite the dead craft job ahead in the queue (elapsed: ${ticks} ticks)`,
        );

        const queue = harness.root.requireEcsComponent(JobQueueComponentId);
        const craftJob = queue.jobs.find((job) => job.id === CraftingJobId);
        assert.ok(
            craftJob !== undefined,
            "the unplannable craft job should stay queued for when materials arrive",
        );
        assert.strictEqual(
            craftJob.claimedBy,
            undefined,
            "no worker should be left holding a claim on the unplannable craft job",
        );
    });

    it("falls through a higher-utility behavior that expands to nothing", () => {
        /**
         * Hungry worker (hunger 70 puts eat's utility ~60 above performJob's
         * 50) in a world with no food of any kind, so eat is valid but expands
         * to no actions. The queued tree job must still get done instead of
         * the worker idling hungry forever.
         */
        const harness = new ScenarioHarness();
        const worker = harness.addWorker("worker", { x: 10, y: 8 });
        const tree = addTree(harness, { x: 14, y: 8 });

        const hunger = worker.getEcsComponent(HungerComponentId)!;
        hunger.hunger = 70;

        harness.queueJob(CollectResourceJob(tree, ResourceHarvestMode.Chop));

        const ticks = harness.tickUntil(
            () => harness.getHeldAmount(worker, "wood") > 0,
            60,
        );

        assert.ok(
            harness.getHeldAmount(worker, "wood") > 0,
            `worker should work while hungry when no food exists (elapsed: ${ticks} ticks)`,
        );
    });
});
