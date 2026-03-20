import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { planProduction } from "../../../../src/game/job/planner/productionPlanner.ts";
import { createProductionJob } from "../../../../src/game/job/productionJob.ts";
import { createJobQueueComponent } from "../../../../src/game/component/jobQueueComponent.ts";
import { createProductionComponent } from "../../../../src/game/component/productionComponent.ts";
import {
    createChunkMapComponent,
} from "../../../../src/game/component/chunkMapComponent.ts";

function createExtractScene(): {
    root: Entity;
    worker: Entity;
    building: Entity;
} {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const building = new Entity("building");

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);
    root.addChild(building);

    worker.worldPosition = { x: 10, y: 8 };
    building.worldPosition = { x: 15, y: 13 };

    building.setEcsComponent(createProductionComponent("quarry_production", 4));

    return { root, worker, building };
}

function createZoneScene(): {
    root: Entity;
    worker: Entity;
    building: Entity;
} {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const building = new Entity("building");

    root.setEcsComponent(createJobQueueComponent());
    root.setEcsComponent(createChunkMapComponent());
    root.addChild(worker);
    root.addChild(building);

    worker.worldPosition = { x: 10, y: 8 };
    building.worldPosition = { x: 20, y: 15 };

    building.setEcsComponent(
        createProductionComponent("forrester_production", 4),
    );

    return { root, worker, building };
}

describe("productionPlanner - extract kind", () => {
    it("returns moveTo and operateFacility actions", () => {
        const { root, worker } = createExtractScene();

        const job = createProductionJob("building");
        const actions = planProduction(root, worker, job);

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "operateFacility");
    });

    it("sets correct target position for moveTo action", () => {
        const { root, worker, building } = createExtractScene();
        building.worldPosition = { x: 10, y: 15 };

        const job = createProductionJob("building");
        const actions = planProduction(root, worker, job);

        const moveAction = actions[0] as {
            type: "moveTo";
            target: { x: number; y: number };
        };
        assert.strictEqual(moveAction.target.x, 10);
        assert.strictEqual(moveAction.target.y, 15);
    });

    it("sets stopAdjacent cardinal for moveTo action", () => {
        const { root, worker } = createExtractScene();

        const job = createProductionJob("building");
        const actions = planProduction(root, worker, job);

        const moveAction = actions[0] as {
            type: "moveTo";
            stopAdjacent?: string;
        };
        assert.strictEqual(moveAction.stopAdjacent, "cardinal");
    });

    it("sets correct buildingId for operateFacility action", () => {
        const { root, worker } = createExtractScene();

        const job = createProductionJob("building");
        const actions = planProduction(root, worker, job);

        const operateAction = actions[1] as {
            type: "operateFacility";
            buildingId: string;
        };
        assert.strictEqual(operateAction.buildingId, "building");
    });

    it("returns empty array and fails job if building not found", () => {
        const { root, worker } = createExtractScene();

        const job = createProductionJob("nonexistent");
        const actions = planProduction(root, worker, job);

        assert.strictEqual(actions.length, 0);
    });
});

describe("productionPlanner - zone kind", () => {
    it("returns moveTo and plantTree actions when zone has empty spots", () => {
        const { root, worker } = createZoneScene();

        const job = createProductionJob("building");
        const actions = planProduction(root, worker, job);

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "plantTree");
    });

    it("plantTree action carries the building id", () => {
        const { root, worker } = createZoneScene();

        const job = createProductionJob("building");
        const actions = planProduction(root, worker, job);

        const plantAction = actions[1] as {
            type: "plantTree";
            buildingId: string;
            targetPosition: { x: number; y: number };
        };
        assert.strictEqual(plantAction.buildingId, "building");
    });

    it("moveTo target matches plantTree targetPosition", () => {
        const { root, worker } = createZoneScene();

        const job = createProductionJob("building");
        const actions = planProduction(root, worker, job);

        const moveAction = actions[0] as {
            type: "moveTo";
            target: { x: number; y: number };
        };
        const plantAction = actions[1] as {
            type: "plantTree";
            targetPosition: { x: number; y: number };
        };
        assert.deepStrictEqual(moveAction.target, plantAction.targetPosition);
    });

    it("returns empty array and fails job when no ChunkMapComponent on root", () => {
        const root = new Entity("root");
        const worker = new Entity("worker");
        const building = new Entity("building");

        root.setEcsComponent(createJobQueueComponent());
        root.addChild(worker);
        root.addChild(building);

        worker.worldPosition = { x: 10, y: 8 };
        building.worldPosition = { x: 20, y: 15 };
        building.setEcsComponent(
            createProductionComponent("forrester_production", 4),
        );

        const job = createProductionJob("building");
        const actions = planProduction(root, worker, job);

        assert.strictEqual(actions.length, 0);
    });

    it("returns empty array and fails job if building not found", () => {
        const { root, worker } = createZoneScene();

        const job = createProductionJob("nonexistent");
        const actions = planProduction(root, worker, job);

        assert.strictEqual(actions.length, 0);
    });
});
