import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createJobQueueComponent } from "../../../src/game/component/jobQueueComponent.ts";
import {
    createFarmComponent,
    FarmComponentId,
    FarmState,
} from "../../../src/game/component/farmComponent.ts";
import { planFarmPlant } from "../../../src/game/job/planner/farmPlantJobPlanner.ts";
import { createFarmPlantJob } from "../../../src/game/job/farmPlantJob.ts";
import { executePlantCropAction } from "../../../src/game/behavior/actions/plantCropAction.ts";
import { createInventoryComponent } from "../../../src/game/component/inventoryComponent.ts";

function createTestScene(): { root: Entity; worker: Entity; farm: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const farm = new Entity("farm");

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);
    root.addChild(farm);

    worker.worldPosition = { x: 12, y: 8 };
    farm.worldPosition = { x: 13, y: 8 }; // Adjacent to worker

    farm.setEcsComponent(createFarmComponent());
    worker.setEcsComponent(createInventoryComponent());

    return { root, worker, farm };
}

describe("farmPlantJobPlanner", () => {
    it("returns moveTo and plantCrop actions for valid job", () => {
        const { root, worker } = createTestScene();
        const job = createFarmPlantJob("farm");
        const actions = planFarmPlant(root, worker, job);

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "plantCrop");
    });

    it("moveTo targets farm position", () => {
        const { root, worker, farm } = createTestScene();
        farm.worldPosition = { x: 20, y: 15 };

        const job = createFarmPlantJob("farm");
        const actions = planFarmPlant(root, worker, job);

        const moveAction = actions[0] as { type: "moveTo"; target: { x: number; y: number }; stopAdjacent?: string };
        assert.strictEqual(moveAction.target.x, 20);
        assert.strictEqual(moveAction.target.y, 15);
    });

    it("moveTo uses stopAdjacent cardinal", () => {
        const { root, worker } = createTestScene();
        const job = createFarmPlantJob("farm");
        const actions = planFarmPlant(root, worker, job);

        const moveAction = actions[0] as { type: "moveTo"; stopAdjacent?: string };
        assert.strictEqual(moveAction.stopAdjacent, "cardinal");
    });

    it("plantCrop references the correct building id", () => {
        const { root, worker } = createTestScene();
        const job = createFarmPlantJob("farm");
        const actions = planFarmPlant(root, worker, job);

        const plantAction = actions[1] as { type: "plantCrop"; buildingId: string };
        assert.strictEqual(plantAction.buildingId, "farm");
    });

    it("returns empty array when farm building not found", () => {
        const root = new Entity("root");
        const worker = new Entity("worker");
        root.setEcsComponent(createJobQueueComponent());
        root.addChild(worker);
        worker.worldPosition = { x: 12, y: 8 };

        const job = createFarmPlantJob("nonexistent");
        const actions = planFarmPlant(root, worker, job);

        assert.strictEqual(actions.length, 0);
    });
});

describe("plantCropAction", () => {
    it("returns running before work duration completes", () => {
        const { worker } = createTestScene();
        const action = { type: "plantCrop" as const, buildingId: "farm" };

        const result = executePlantCropAction(action, worker, 10);

        assert.strictEqual(result.kind, "running");
    });

    it("increments workProgress on each tick", () => {
        const { worker } = createTestScene();
        const action = { type: "plantCrop" as const, buildingId: "farm", workProgress: 0 };

        executePlantCropAction(action, worker, 10);

        assert.strictEqual(action.workProgress, 1);
    });

    it("transitions farm from Empty to Growing after 3 ticks", () => {
        const { worker, farm } = createTestScene();
        const action = { type: "plantCrop" as const, buildingId: "farm", workProgress: 2 };

        const result = executePlantCropAction(action, worker, 100);

        assert.strictEqual(result.kind, "complete");
        const farmComp = farm.getEcsComponent(FarmComponentId)!;
        assert.strictEqual(farmComp.state, FarmState.Growing);
    });

    it("sets plantedAtTick to current tick on completion", () => {
        const { worker, farm } = createTestScene();
        const action = { type: "plantCrop" as const, buildingId: "farm", workProgress: 2 };

        executePlantCropAction(action, worker, 42);

        const farmComp = farm.getEcsComponent(FarmComponentId)!;
        assert.strictEqual(farmComp.plantedAtTick, 42);
    });

    it("completes without state change if farm is not Empty", () => {
        const { worker, farm } = createTestScene();
        const farmComp = farm.getEcsComponent(FarmComponentId)!;
        farmComp.state = FarmState.Growing;

        const action = { type: "plantCrop" as const, buildingId: "farm" };
        const result = executePlantCropAction(action, worker, 10);

        assert.strictEqual(result.kind, "complete");
        assert.strictEqual(farmComp.state, FarmState.Growing);
    });

    it("fails when farm building is not found", () => {
        const { worker } = createTestScene();
        const action = { type: "plantCrop" as const, buildingId: "nonexistent" };

        const result = executePlantCropAction(action, worker, 10);

        assert.strictEqual(result.kind, "failed");
    });

    it("fails when worker is not adjacent to farm", () => {
        const { worker, farm } = createTestScene();
        farm.worldPosition = { x: 25, y: 25 };

        const action = { type: "plantCrop" as const, buildingId: "farm" };
        const result = executePlantCropAction(action, worker, 10);

        assert.strictEqual(result.kind, "failed");
    });
});
