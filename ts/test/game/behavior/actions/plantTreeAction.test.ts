import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { createProductionComponent } from "../../../../src/game/component/productionComponent.ts";
import { ResourceComponentId } from "../../../../src/game/component/resourceComponent.ts";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../../../../src/game/component/jobQueueComponent.ts";
import { executePlantTreeAction } from "../../../../src/game/behavior/actions/plantTreeAction.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/ActionData.ts";
import { claimJobInQueue } from "../../../../src/game/job/jobLifecycle.ts";
import { createProductionJob } from "../../../../src/game/job/productionJob.ts";

type PlantTreeAction = Extract<BehaviorActionData, { type: "plantTree" }>;

function createTestScene(): {
    root: Entity;
    worker: Entity;
    building: Entity;
} {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const building = new Entity("building");

    root.addChild(worker);
    root.addChild(building);

    worker.worldPosition = { x: 12, y: 8 };
    building.worldPosition = { x: 20, y: 15 };

    building.setEcsComponent(
        createProductionComponent("forrester_production", 4),
    );

    return { root, worker, building };
}

describe("plantTreeAction", () => {
    it("returns running and initialises progress on first tick", () => {
        const { worker } = createTestScene();

        const action: PlantTreeAction = {
            type: "plantTree",
            buildingId: "building",
            targetPosition: { x: 12, y: 8 },
        };

        const result = executePlantTreeAction(action, worker);

        assert.strictEqual(result.kind, "running");
        assert.strictEqual(action.progress, 1);
    });

    it("increments progress each tick", () => {
        const { worker } = createTestScene();

        const action: PlantTreeAction = {
            type: "plantTree",
            buildingId: "building",
            targetPosition: { x: 12, y: 8 },
            progress: 1,
        };

        executePlantTreeAction(action, worker);

        assert.strictEqual(action.progress, 2);
    });

    it("spawns resource entity at targetPosition when progress reaches plantDuration", () => {
        const { root, worker } = createTestScene();

        // forrester_production has plantDuration: 3, so progress 2 -> completes on tick 3
        const targetPosition = { x: 12, y: 8 };
        const action: PlantTreeAction = {
            type: "plantTree",
            buildingId: "building",
            targetPosition,
            progress: 2,
        };

        const result = executePlantTreeAction(action, worker);

        assert.strictEqual(result.kind, "complete");

        const children = root.children;
        const spawned = children.find(
            (c) =>
                c.getEcsComponent(ResourceComponentId)?.resourceId === "tree1",
        );
        assert.ok(spawned, "Expected a tree entity to be spawned");
        assert.strictEqual(spawned.worldPosition.x, targetPosition.x);
        assert.strictEqual(spawned.worldPosition.y, targetPosition.y);
    });

    it("completes the claimed job on success", () => {
        const root = new Entity("root");
        const settlement = new Entity("settlement");
        const worker = new Entity("worker");
        const building = new Entity("building");

        root.addChild(settlement);
        settlement.setEcsComponent(createJobQueueComponent());
        settlement.addChild(worker);
        root.addChild(building);

        worker.worldPosition = { x: 12, y: 8 };
        building.worldPosition = { x: 20, y: 15 };
        building.setEcsComponent(
            createProductionComponent("forrester_production", 4),
        );

        const job = createProductionJob("building");
        const jobQueue = settlement.getEcsComponent(JobQueueComponentId)!;
        jobQueue.jobs.push(job);
        claimJobInQueue(job, worker.id, settlement);

        const action: PlantTreeAction = {
            type: "plantTree",
            buildingId: "building",
            targetPosition: { x: 12, y: 8 },
            progress: 2,
        };

        executePlantTreeAction(action, worker);

        const remaining = settlement.getEcsComponent(JobQueueComponentId)!.jobs;
        const stillClaimed = remaining.find((j) => j.claimedBy === worker.id);
        assert.ok(
            !stillClaimed,
            "Job should be completed and removed from queue",
        );
    });

    it("fails if building entity not found", () => {
        const { worker } = createTestScene();

        const action: PlantTreeAction = {
            type: "plantTree",
            buildingId: "nonexistent",
            targetPosition: { x: 12, y: 8 },
        };

        const result = executePlantTreeAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });

    it("fails if building has no ProductionComponent", () => {
        const { root, worker } = createTestScene();
        const bareBuilding = new Entity("bareBuilding");
        root.addChild(bareBuilding);
        bareBuilding.worldPosition = { x: 20, y: 15 };

        const action: PlantTreeAction = {
            type: "plantTree",
            buildingId: "bareBuilding",
            targetPosition: { x: 12, y: 8 },
        };

        const result = executePlantTreeAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });

    it("fails if production definition is not zone kind", () => {
        const { root, worker } = createTestScene();
        const quarryBuilding = new Entity("quarryBuilding");
        root.addChild(quarryBuilding);
        quarryBuilding.worldPosition = { x: 20, y: 15 };
        quarryBuilding.setEcsComponent(
            createProductionComponent("quarry_production", 4),
        );

        const action: PlantTreeAction = {
            type: "plantTree",
            buildingId: "quarryBuilding",
            targetPosition: { x: 12, y: 8 },
        };

        const result = executePlantTreeAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });
});
