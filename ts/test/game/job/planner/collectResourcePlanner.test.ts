import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { planCollectResource } from "../../../../src/game/job/planner/collectResourcePlanner.ts";
import { CollectResourceJob } from "../../../../src/game/job/collectResourceJob.ts";
import { ResourceHarvestMode } from "../../../../src/data/inventory/items/naturalResource.ts";
import { createJobQueueComponent } from "../../../../src/game/component/jobQueueComponent.ts";

function createTestScene(): { root: Entity; worker: Entity; resource: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const resource = new Entity("resource");

    worker.worldPosition = { x: 0, y: 0 };
    resource.worldPosition = { x: 5, y: 5 };

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);
    root.addChild(resource);

    return { root, worker, resource };
}

describe("collectResourcePlanner", () => {
    it("returns moveTo and harvestResource actions", () => {
        const { root, worker, resource } = createTestScene();

        const job = CollectResourceJob(resource, ResourceHarvestMode.Chop);
        const actions = planCollectResource(root, worker, job);

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "harvestResource");
    });

    it("sets correct target position for moveTo action", () => {
        const { root, worker, resource } = createTestScene();
        resource.worldPosition = { x: 10, y: 15 };

        const job = CollectResourceJob(resource, ResourceHarvestMode.Chop);
        const actions = planCollectResource(root, worker, job);

        const moveAction = actions[0] as {
            type: "moveTo";
            target: { x: number; y: number };
            stopAdjacent?: string;
        };
        assert.strictEqual(moveAction.target.x, 10);
        assert.strictEqual(moveAction.target.y, 15);
    });

    it("sets stopAdjacent to cardinal for moveTo action", () => {
        const { root, worker, resource } = createTestScene();

        const job = CollectResourceJob(resource, ResourceHarvestMode.Chop);
        const actions = planCollectResource(root, worker, job);

        const moveAction = actions[0] as {
            type: "moveTo";
            target: { x: number; y: number };
            stopAdjacent?: string;
        };
        assert.strictEqual(
            moveAction.stopAdjacent,
            "cardinal",
            "moveTo should have stopAdjacent: cardinal for resource harvesting",
        );
    });

    it("sets correct entityId and harvestAction for harvestResource action", () => {
        const { root, worker, resource } = createTestScene();

        const job = CollectResourceJob(resource, ResourceHarvestMode.Mine);
        const actions = planCollectResource(root, worker, job);

        const harvestAction = actions[1] as { type: "harvestResource"; entityId: string; harvestAction: number };
        assert.strictEqual(harvestAction.entityId, "resource");
        assert.strictEqual(harvestAction.harvestAction, ResourceHarvestMode.Mine);
    });

    it("returns empty array and fails job if resource not found", () => {
        const { root, worker } = createTestScene();

        const job: ReturnType<typeof CollectResourceJob> = {
            id: "collectResource",
            entityId: "nonexistent",
            harvestAction: ResourceHarvestMode.Chop,
        };

        const actions = planCollectResource(root, worker, job);

        assert.strictEqual(actions.length, 0);
    });
});
