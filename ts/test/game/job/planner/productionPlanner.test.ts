import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { planProduction } from "../../../../src/game/job/planner/productionPlanner.ts";
import { createProductionJob } from "../../../../src/game/job/productionJob.ts";
import { createJobQueueComponent } from "../../../../src/game/component/jobQueueComponent.ts";

function createTestScene(): { root: Entity; worker: Entity; building: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const building = new Entity("building");

    worker.worldPosition = { x: 10, y: 8 };
    building.worldPosition = { x: 15, y: 13 };

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);
    root.addChild(building);

    return { root, worker, building };
}

describe("productionPlanner", () => {
    it("returns moveTo and operateFacility actions", () => {
        const { root, worker } = createTestScene();

        const job = createProductionJob("building");
        const actions = planProduction(root, worker, job);

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "operateFacility");
    });

    it("sets correct target position for moveTo action", () => {
        const { root, worker, building } = createTestScene();
        building.worldPosition = { x: 10, y: 15 };

        const job = createProductionJob("building");
        const actions = planProduction(root, worker, job);

        const moveAction = actions[0] as { type: "moveTo"; target: { x: number; y: number } };
        assert.strictEqual(moveAction.target.x, 10);
        assert.strictEqual(moveAction.target.y, 15);
    });

    it("sets correct buildingId for operateFacility action", () => {
        const { root, worker } = createTestScene();

        const job = createProductionJob("building");
        const actions = planProduction(root, worker, job);

        const operateAction = actions[1] as { type: "operateFacility"; buildingId: string };
        assert.strictEqual(operateAction.buildingId, "building");
    });

    it("returns empty array and fails job if building not found", () => {
        const { root, worker } = createTestScene();

        const job = createProductionJob("nonexistent");
        const actions = planProduction(root, worker, job);

        assert.strictEqual(actions.length, 0);
    });
});
