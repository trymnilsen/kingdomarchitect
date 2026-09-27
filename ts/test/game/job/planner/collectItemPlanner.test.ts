import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { planCollectItem } from "../../../../src/game/job/planner/collectItemPlanner.ts";
import { CollectItemJob } from "../../../../src/game/job/collectItemJob.ts";
import {
    addJob,
    createJobQueueComponent,
    JobQueueComponentId,
} from "../../../../src/game/component/jobQueueComponent.ts";
import { createCollectableComponent } from "../../../../src/game/component/collectableComponent.ts";
import {
    stoneResource,
    woodResourceItem,
} from "../../../../src/data/inventory/items/resources.ts";

function createTestScene(): { root: Entity; worker: Entity; chest: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const chest = new Entity("chest");

    worker.worldPosition = { x: 10, y: 8 };
    chest.worldPosition = { x: 15, y: 13 };

    chest.setEcsComponent(
        createCollectableComponent([{ item: woodResourceItem, amount: 4 }]),
    );

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);
    root.addChild(chest);

    return { root, worker, chest };
}

describe("collectItemPlanner", () => {
    it("returns empty array and fails job if entity not found", () => {
        const { root, worker } = createTestScene();

        const job: ReturnType<typeof CollectItemJob> = {
            id: "collectItem",
            entityId: "nonexistent",
            itemId: woodResourceItem.id,
        };
        const queue = root.requireEcsComponent(JobQueueComponentId);
        addJob(queue, job);

        const actions = planCollectItem(root, worker, job);

        assert.strictEqual(actions.length, 0);
        assert.strictEqual(queue.jobs.length, 0, "the job is dropped");
    });

    it("fails the job when the target no longer holds that item", () => {
        const { root, worker, chest } = createTestScene();

        // The entity is still there, but somebody already hauled this stack,
        // or it never held stone to begin with.
        const job = CollectItemJob(chest, stoneResource.id);
        const queue = root.requireEcsComponent(JobQueueComponentId);
        addJob(queue, job);

        const actions = planCollectItem(root, worker, job);

        assert.strictEqual(actions.length, 0, "nobody is sent walking");
        assert.strictEqual(queue.jobs.length, 0, "the job is dropped");
    });
});
