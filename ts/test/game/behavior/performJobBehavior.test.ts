import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createPerformJobBehavior } from "../../../src/game/behavior/behaviors/performJobBehavior.ts";
import { planBuildBuilding } from "../../../src/game/job/planner/buildBuildingPlanner.ts";
import { canExecuteBuildJob } from "../../../src/game/job/buildBuildingJob.ts";
import {
    addJob,
    createJobQueueComponent,
} from "../../../src/game/component/jobQueueComponent.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../src/game/component/heldItemComponent.ts";
import { createBehaviorAgentComponent } from "../../../src/game/component/behaviorAgentComponent.ts";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.ts";
import { createHealthComponent } from "../../../src/game/component/healthComponent.ts";
import { MoveToJob } from "../../../src/game/job/moveToPointJob.ts";
import { CollectResourceJob } from "../../../src/game/job/collectResourceJob.ts";
import { ResourceHarvestMode } from "../../../src/data/inventory/items/naturalResource.ts";
import {
    woodResourceItem,
    stoneResource,
} from "../../../src/data/inventory/items/resources.ts";

describe("performJobBehavior", () => {
    /**
     * Covers the claimRequiresEmptyHand gate: a worker that opts in (player
     * workers) may not claim a new job while carrying something, so it deposits
     * its load before taking more work rather than panic-dropping it. A moveToJob
     * is used because it is not subject to the collect-resource yield guard, so
     * these tests isolate the empty-hand gate itself.
     */
    describe("empty-hand claim gate", () => {
        function setupWorker(root: Entity): Entity {
            const worker = new Entity("worker");
            worker.setEcsComponent(createHeldItemComponent());
            worker.setEcsComponent(createBehaviorAgentComponent());
            root.addChild(worker);
            worker.worldPosition = { x: 12, y: 8 };
            return worker;
        }

        function holdWood(worker: Entity): void {
            const held = worker.requireEcsComponent(HeldItemComponentId);
            held.item = woodResourceItem;
            held.amount = 3;
        }

        it("blocks claiming a new job while holding when the gate is on", () => {
            const root = new Entity("root");
            root.setEcsComponent(createJobQueueComponent());
            const worker = setupWorker(root);
            holdWood(worker);

            const queue = root.requireEcsComponent("JobQueue");
            addJob(queue, MoveToJob(worker, { x: 14, y: 8 }));

            const behavior = createPerformJobBehavior(
                planBuildBuilding,
                canExecuteBuildJob,
                true,
            );

            assert.strictEqual(
                behavior.isValid(worker),
                false,
                "worker with a full hand should not consider performJob",
            );
            assert.deepStrictEqual(
                behavior.expand(worker),
                [],
                "worker with a full hand should claim no job",
            );
            assert.strictEqual(
                queue.jobs[0].claimedBy,
                undefined,
                "job should remain unclaimed",
            );
        });

        it("claims the job once the hand is empty", () => {
            const root = new Entity("root");
            root.setEcsComponent(createJobQueueComponent());
            const worker = setupWorker(root);

            const queue = root.requireEcsComponent("JobQueue");
            addJob(queue, MoveToJob(worker, { x: 14, y: 8 }));

            const behavior = createPerformJobBehavior(
                planBuildBuilding,
                canExecuteBuildJob,
                true,
            );

            assert.strictEqual(behavior.isValid(worker), true);
            assert.ok(
                behavior.expand(worker).length > 0,
                "empty-handed worker should claim and plan the job",
            );
            assert.strictEqual(queue.jobs[0].claimedBy, worker.id);
        });

        it("does not gate when claimRequiresEmptyHand is off (goblin default)", () => {
            const root = new Entity("root");
            root.setEcsComponent(createJobQueueComponent());
            const worker = setupWorker(root);
            holdWood(worker);

            const queue = root.requireEcsComponent("JobQueue");
            addJob(queue, MoveToJob(worker, { x: 14, y: 8 }));

            const behavior = createPerformJobBehavior(planBuildBuilding);

            assert.strictEqual(
                behavior.isValid(worker),
                true,
                "default behavior should still claim jobs while holding",
            );
            assert.ok(behavior.expand(worker).length > 0);
        });
    });

    /**
     * Covers the harvest precondition guard: a worker carrying an item that
     * doesn't match the resource's yield must not claim the collect job.
     * Without the guard the worker walks to the tree, swings for several
     * ticks, and fails at deposit with full progress wasted.
     */
    describe("collect-resource held guard", () => {
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
            assert.ok(
                actions.length > 0,
                "worker should claim and plan the job",
            );
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

    /**
     * Guards the agreement between isValid() and expand(). They share canTakeJob, so a
     * job whose target entity is no longer in the tree (a "stale" job left in the queue
     * after the resource was removed) must be invisible to BOTH: isValid() returns false
     * and expand() returns []. If they diverged, an empty-handed worker would keep
     * selecting performJob and producing no actions, leaving it stranded on the behavior
     * with no activity to display.
     *
     * The worker is empty-handed here because the held-item guard short-circuits to
     * "ok" for empty hands, so only the target-existence check can reject the job.
     */
    describe("stale job target", () => {
        function setupWorker(): Entity {
            const worker = new Entity("worker");
            worker.setEcsComponent(createHeldItemComponent());
            worker.setEcsComponent(createBehaviorAgentComponent());
            return worker;
        }

        it("isValid() is false and expand() is empty when the job's target is gone", () => {
            const root = new Entity("root");
            root.setEcsComponent(createJobQueueComponent());
            const worker = setupWorker();
            root.addChild(worker);
            worker.worldPosition = { x: 12, y: 8 };

            // Build a collect job from a tree that is NEVER added to the tree, so
            // root.findEntity(job.entityId) resolves to null, a stale queued job.
            const ghostTree = new Entity("ghostTree");
            const queue = root.requireEcsComponent("JobQueue");
            addJob(
                queue,
                CollectResourceJob(ghostTree, ResourceHarvestMode.Chop),
            );

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
});
