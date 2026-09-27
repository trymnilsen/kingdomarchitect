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

    worker.worldPosition = { x: 10, y: 8 };
    resource.worldPosition = { x: 15, y: 13 };

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);
    root.addChild(resource);

    return { root, worker, resource };
}

describe("collectResourcePlanner", () => {
    it("stops the worker beside the resource rather than on it", () => {
        const { root, worker, resource } = createTestScene();

        const job = CollectResourceJob(resource, ResourceHarvestMode.Chop);
        const actions = planCollectResource(root, worker, job);

        const moveAction = actions[0] as {
            type: "moveTo";
            goal?: { kind: string };
        };
        assert.deepStrictEqual(
            moveAction.goal,
            { kind: "adjacent" },
            "a tree cannot be stood on, so harvesting needs an adjacent goal",
        );
    });
});
