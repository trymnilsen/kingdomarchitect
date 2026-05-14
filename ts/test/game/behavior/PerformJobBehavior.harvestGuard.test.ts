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
import {
    woodResourceItem,
    stoneResource,
} from "../../../src/data/inventory/items/resources.ts";

/**
 * Verifies the harvest precondition guard: a worker carrying an item that
 * doesn't match the resource's yield must not claim the collect job.
 * Without the guard the worker walks to the tree, swings for several
 * ticks, and fails at deposit with full progress wasted.
 */
function setupWorker(): Entity {
    const worker = new Entity("worker");
    worker.worldPosition = { x: 5, y: 5 };
    worker.setEcsComponent(createHeldItemComponent());
    worker.setEcsComponent(createBehaviorAgentComponent());
    return worker;
}

function setupTree(root: Entity, position = { x: 6, y: 5 }): Entity {
    const tree = new Entity("tree");
    tree.setEcsComponent(createResourceComponent("tree1"));
    tree.setEcsComponent(createHealthComponent(10, 10));
    root.addChild(tree);
    tree.worldPosition = position;
    return tree;
}

describe("PerformJobBehavior — collect-resource held guard", () => {
    it("skips collect-resource job when held holds a different item id", () => {
        const root = new Entity("root");
        root.setEcsComponent(createJobQueueComponent());
        const worker = setupWorker();
        root.addChild(worker);

        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = stoneResource;
        held.amount = 1;

        const tree = setupTree(root);
        const queue = root.requireEcsComponent("JobQueue");
        addJob(queue, CollectResourceJob(tree, ResourceHarvestMode.Chop));

        const behavior = createPerformJobBehavior(planBuildBuilding);
        const actions = behavior.expand(worker);
        assert.deepStrictEqual(
            actions,
            [],
            "worker should not claim the harvest job while holding stone",
        );
        assert.strictEqual(
            queue.jobs[0].claimedBy,
            undefined,
            "job should remain unclaimed",
        );
    });

    it("claims collect-resource job when held is empty", () => {
        const root = new Entity("root");
        root.setEcsComponent(createJobQueueComponent());
        const worker = setupWorker();
        root.addChild(worker);

        const tree = setupTree(root);
        const queue = root.requireEcsComponent("JobQueue");
        addJob(queue, CollectResourceJob(tree, ResourceHarvestMode.Chop));

        const behavior = createPerformJobBehavior(planBuildBuilding);
        const actions = behavior.expand(worker);
        assert.ok(actions.length > 0, "worker should claim and plan the job");
        assert.strictEqual(queue.jobs[0].claimedBy, worker.id);
    });

    it("claims collect-resource job when held already holds the yield item id", () => {
        const root = new Entity("root");
        root.setEcsComponent(createJobQueueComponent());
        const worker = setupWorker();
        root.addChild(worker);

        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 2;

        const tree = setupTree(root);
        const queue = root.requireEcsComponent("JobQueue");
        addJob(queue, CollectResourceJob(tree, ResourceHarvestMode.Chop));

        const behavior = createPerformJobBehavior(planBuildBuilding);
        const actions = behavior.expand(worker);
        assert.ok(
            actions.length > 0,
            "worker carrying wood should still claim a tree-chop job",
        );
    });
});
