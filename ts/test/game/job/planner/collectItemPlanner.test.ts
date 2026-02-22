import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { planCollectItem } from "../../../../src/game/job/planner/collectItemPlanner.ts";
import { CollectItemJob } from "../../../../src/game/job/collectItemJob.ts";
import { createJobQueueComponent } from "../../../../src/game/component/jobQueueComponent.ts";

function createTestScene(): { root: Entity; worker: Entity; chest: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const chest = new Entity("chest");

    worker.worldPosition = { x: 10, y: 8 };
    chest.worldPosition = { x: 15, y: 13 };

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);
    root.addChild(chest);

    return { root, worker, chest };
}

describe("collectItemPlanner", () => {
    it("returns moveTo and collectItems actions", () => {
        const { root, worker, chest } = createTestScene();

        const job = CollectItemJob(chest);
        const actions = planCollectItem(root, worker, job);

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "collectItems");
    });

    it("sets correct target position for moveTo action", () => {
        const { root, worker, chest } = createTestScene();
        chest.worldPosition = { x: 10, y: 15 };

        const job = CollectItemJob(chest);
        const actions = planCollectItem(root, worker, job);

        const moveAction = actions[0] as { type: "moveTo"; target: { x: number; y: number } };
        assert.strictEqual(moveAction.target.x, 10);
        assert.strictEqual(moveAction.target.y, 15);
    });

    it("sets correct entityId for collectItems action", () => {
        const { root, worker, chest } = createTestScene();

        const job = CollectItemJob(chest);
        const actions = planCollectItem(root, worker, job);

        const collectAction = actions[1] as { type: "collectItems"; entityId: string };
        assert.strictEqual(collectAction.entityId, "chest");
    });

    it("returns empty array and fails job if entity not found", () => {
        const { root, worker } = createTestScene();

        const job: ReturnType<typeof CollectItemJob> = {
            id: "collectItem",
            entityId: "nonexistent",
        };

        const actions = planCollectItem(root, worker, job);

        assert.strictEqual(actions.length, 0);
    });
});
