import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createPerformJobBehavior } from "../../../src/game/behavior/behaviors/PerformJobBehavior.ts";
import { planBuildBuilding } from "../../../src/game/job/planner/buildBuildingPlanner.ts";
import {
    addJob,
    createJobQueueComponent,
} from "../../../src/game/component/jobQueueComponent.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../src/game/component/heldItemComponent.ts";
import { createBehaviorAgentComponent } from "../../../src/game/component/BehaviorAgentComponent.ts";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.ts";
import { createHealthComponent } from "../../../src/game/component/healthComponent.ts";
import { CollectResourceJob } from "../../../src/game/job/collectResourceJob.ts";
import { ResourceHarvestMode } from "../../../src/data/inventory/items/naturalResource.ts";

/**
 * Guards the agreement between isValid() and expand(). They share canTakeJob, so a
 * job whose target entity is no longer in the tree (a "stale" job left in the queue
 * after the resource was removed) must be invisible to BOTH: isValid() returns false
 * and expand() returns []. If they diverged, an empty-handed worker would keep
 * selecting performJob and producing no actions, leaving it stranded on the behavior
 * with no activity to display.
 *
 * The worker is empty-handed on purpose: the held-item guard short-circuits to "ok"
 * for empty hands, so only the target-existence check can reject the job here.
 */
function setupWorker(): Entity {
    const worker = new Entity("worker");
    worker.setEcsComponent(createHeldItemComponent());
    worker.setEcsComponent(createBehaviorAgentComponent());
    return worker;
}

describe("PerformJobBehavior — stale job target", () => {
    it("isValid() is false and expand() is empty when the job's target is gone", () => {
        const root = new Entity("root");
        root.setEcsComponent(createJobQueueComponent());
        const worker = setupWorker();
        root.addChild(worker);
        worker.worldPosition = { x: 12, y: 8 };

        // Build a collect job from a tree that is NEVER added to the tree, so
        // root.findEntity(job.entityId) resolves to null — a stale queued job.
        const ghostTree = new Entity("ghostTree");
        const queue = root.requireEcsComponent("JobQueue");
        addJob(queue, CollectResourceJob(ghostTree, ResourceHarvestMode.Chop));

        const behavior = createPerformJobBehavior(planBuildBuilding);

        assert.strictEqual(
            behavior.isValid(worker),
            false,
            "a job whose target entity is gone must not count as available",
        );
        assert.deepStrictEqual(
            behavior.expand(worker),
            [],
            "expand must produce no actions for a stale job",
        );
        assert.strictEqual(
            queue.jobs[0].claimedBy,
            undefined,
            "stale job must remain unclaimed",
        );
    });

    it("isValid() is true and expand() produces actions when the target exists", () => {
        const root = new Entity("root");
        root.setEcsComponent(createJobQueueComponent());
        const worker = setupWorker();
        root.addChild(worker);
        worker.worldPosition = { x: 12, y: 8 };

        const tree = new Entity("tree");
        tree.setEcsComponent(createResourceComponent("tree1"));
        tree.setEcsComponent(createHealthComponent(10, 10));
        root.addChild(tree);
        tree.worldPosition = { x: 14, y: 8 };

        const queue = root.requireEcsComponent("JobQueue");
        addJob(queue, CollectResourceJob(tree, ResourceHarvestMode.Chop));

        const behavior = createPerformJobBehavior(planBuildBuilding);

        assert.strictEqual(
            behavior.isValid(worker),
            true,
            "a job with a live target must count as available",
        );
        const actions = behavior.expand(worker);
        assert.ok(
            actions.length > 0,
            "expand must plan actions for a takeable job",
        );
        assert.strictEqual(queue.jobs[0].claimedBy, worker.id);
    });
});
