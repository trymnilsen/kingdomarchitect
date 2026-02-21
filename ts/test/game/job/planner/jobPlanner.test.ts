import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { planJob } from "../../../../src/game/job/planner/jobPlanner.ts";
import { CollectResourceJob } from "../../../../src/game/job/collectResourceJob.ts";
import { createProductionJob } from "../../../../src/game/job/productionJob.ts";
import { CollectItemJob } from "../../../../src/game/job/collectItemJob.ts";
import { AttackJob } from "../../../../src/game/job/attackJob.ts";
import { MoveToJob } from "../../../../src/game/job/moveToPointJob.ts";
import { ResourceHarvestMode } from "../../../../src/data/inventory/items/naturalResource.ts";
import { createJobQueueComponent } from "../../../../src/game/component/jobQueueComponent.ts";
import { createInventoryComponent } from "../../../../src/game/component/inventoryComponent.ts";

function createTestScene(): { root: Entity; worker: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");

    worker.worldPosition = { x: 10, y: 8 };
    worker.setEcsComponent(createInventoryComponent());

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);

    return { root, worker };
}

describe("jobPlanner", () => {
    it("dispatches collectResource jobs to collectResourcePlanner", () => {
        const { root, worker } = createTestScene();
        const resource = new Entity("resource");
        resource.worldPosition = { x: 15, y: 13 };
        root.addChild(resource);

        const job = CollectResourceJob(resource, ResourceHarvestMode.Chop);
        const actions = planJob(root, worker, job, () => []);

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "harvestResource");
    });

    it("dispatches productionJob jobs to productionPlanner", () => {
        const { root, worker } = createTestScene();
        const building = new Entity("building");
        building.worldPosition = { x: 15, y: 13 };
        root.addChild(building);

        const job = createProductionJob("building");
        const actions = planJob(root, worker, job, () => []);

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "operateFacility");
    });

    it("dispatches collectItem jobs to collectItemPlanner", () => {
        const { root, worker } = createTestScene();
        const chest = new Entity("chest");
        chest.worldPosition = { x: 15, y: 13 };
        root.addChild(chest);

        const job = CollectItemJob(chest);
        const actions = planJob(root, worker, job, () => []);

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "collectItems");
    });

    it("dispatches attackJob jobs to attackPlanner", () => {
        const { root, worker } = createTestScene();
        const target = new Entity("target");
        target.worldPosition = { x: 15, y: 13 };
        root.addChild(target);

        const job = AttackJob("worker", "target");
        const actions = planJob(root, worker, job, () => []);

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "attackTarget");
    });

    it("handles moveToJob directly", () => {
        const { root, worker } = createTestScene();

        const job = MoveToJob(worker, { x: 10, y: 15 });
        const actions = planJob(root, worker, job, () => []);

        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].type, "moveTo");
        const moveAction = actions[0] as { type: "moveTo"; target: { x: number; y: number } };
        assert.strictEqual(moveAction.target.x, 10);
        assert.strictEqual(moveAction.target.y, 15);
    });

    it("returns empty array for unknown job type", () => {
        const { root, worker } = createTestScene();

        const unknownJob = { id: "unknownJob" } as any;
        const actions = planJob(root, worker, unknownJob, () => []);

        assert.strictEqual(actions.length, 0);
    });
});
