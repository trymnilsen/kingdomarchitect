import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createPerformJobBehavior } from "../../../src/game/behavior/behaviors/PerformJobBehavior.ts";
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
import { createBehaviorAgentComponent } from "../../../src/game/component/BehaviorAgentComponent.ts";
import { MoveToJob } from "../../../src/game/job/moveToPointJob.ts";
import { woodResourceItem } from "../../../src/data/inventory/items/resources.ts";

/**
 * Verifies the claimRequiresEmptyHand gate: a worker that opts in (player
 * workers) may not claim a new job while carrying something, so it deposits
 * its load before taking more work rather than panic-dropping it. A moveToJob
 * is used because it is not subject to the collect-resource yield guard, so
 * these tests isolate the empty-hand gate itself.
 */
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

describe("PerformJobBehavior — empty-hand claim gate", () => {
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
