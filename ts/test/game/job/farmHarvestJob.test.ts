import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createJobQueueComponent } from "../../../src/game/component/jobQueueComponent.ts";
import {
    createFarmComponent,
    FarmComponentId,
    FarmState,
} from "../../../src/game/component/farmComponent.ts";
import { planFarmHarvest } from "../../../src/game/job/planner/farmHarvestJobPlanner.ts";
import { createFarmHarvestJob } from "../../../src/game/job/farmHarvestJob.ts";
import { executeHarvestCropAction } from "../../../src/game/behavior/actions/harvestCropAction.ts";
import {
    createInventoryComponent,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";

function createTestScene(): { root: Entity; worker: Entity; farm: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const farm = new Entity("farm");

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);
    root.addChild(farm);

    worker.worldPosition = { x: 12, y: 8 };
    farm.worldPosition = { x: 13, y: 8 }; // Adjacent to worker

    const farmComp = createFarmComponent();
    farmComp.state = FarmState.Ready;
    farmComp.cropItemId = "wheat";
    farmComp.cropYieldAmount = 4;
    farm.setEcsComponent(farmComp);

    worker.setEcsComponent(createInventoryComponent());

    return { root, worker, farm };
}

describe("farmHarvestJobPlanner", () => {
    it("returns moveTo and harvestCrop actions for valid job", () => {
        const { root, worker } = createTestScene();
        const job = createFarmHarvestJob("farm");
        const actions = planFarmHarvest(root, worker, job);

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "harvestCrop");
    });

    it("moveTo targets farm position", () => {
        const { root, worker, farm } = createTestScene();
        farm.worldPosition = { x: 20, y: 15 };

        const job = createFarmHarvestJob("farm");
        const actions = planFarmHarvest(root, worker, job);

        const moveAction = actions[0] as { type: "moveTo"; target: { x: number; y: number }; stopAdjacent?: string };
        assert.strictEqual(moveAction.target.x, 20);
        assert.strictEqual(moveAction.target.y, 15);
    });

    it("moveTo uses stopAdjacent cardinal", () => {
        const { root, worker } = createTestScene();
        const job = createFarmHarvestJob("farm");
        const actions = planFarmHarvest(root, worker, job);

        const moveAction = actions[0] as { type: "moveTo"; stopAdjacent?: string };
        assert.strictEqual(moveAction.stopAdjacent, "cardinal");
    });

    it("harvestCrop references the correct building id", () => {
        const { root, worker } = createTestScene();
        const job = createFarmHarvestJob("farm");
        const actions = planFarmHarvest(root, worker, job);

        const harvestAction = actions[1] as { type: "harvestCrop"; buildingId: string };
        assert.strictEqual(harvestAction.buildingId, "farm");
    });

    it("returns empty array when farm building not found", () => {
        const root = new Entity("root");
        const worker = new Entity("worker");
        root.setEcsComponent(createJobQueueComponent());
        root.addChild(worker);
        worker.worldPosition = { x: 12, y: 8 };

        const job = createFarmHarvestJob("nonexistent");
        const actions = planFarmHarvest(root, worker, job);

        assert.strictEqual(actions.length, 0);
    });
});

describe("harvestCropAction", () => {
    it("adds cropYieldAmount of crop item to worker inventory", () => {
        const { worker } = createTestScene();
        const action = { type: "harvestCrop" as const, buildingId: "farm" };

        const result = executeHarvestCropAction(action, worker);

        assert.strictEqual(result.kind, "complete");
        const inventory = worker.getEcsComponent(InventoryComponentId)!;
        const wheatStack = inventory.items.find((s) => s.item.id === "wheat");
        assert.ok(wheatStack, "wheat should be in worker inventory");
        assert.strictEqual(wheatStack.amount, 4);
    });

    it("transitions farm from Ready to Empty", () => {
        const { worker, farm } = createTestScene();
        const action = { type: "harvestCrop" as const, buildingId: "farm" };

        executeHarvestCropAction(action, worker);

        const farmComp = farm.getEcsComponent(FarmComponentId)!;
        assert.strictEqual(farmComp.state, FarmState.Empty);
    });

    it("resets plantedAtTick to 0 after harvest", () => {
        const { worker, farm } = createTestScene();
        const farmComp = farm.getEcsComponent(FarmComponentId)!;
        farmComp.plantedAtTick = 50;

        const action = { type: "harvestCrop" as const, buildingId: "farm" };
        executeHarvestCropAction(action, worker);

        assert.strictEqual(farmComp.plantedAtTick, 0);
    });

    it("completes without state change when farm is not Ready (race condition)", () => {
        const { worker, farm } = createTestScene();
        const farmComp = farm.getEcsComponent(FarmComponentId)!;
        farmComp.state = FarmState.Growing;

        const action = { type: "harvestCrop" as const, buildingId: "farm" };
        const result = executeHarvestCropAction(action, worker);

        assert.strictEqual(result.kind, "complete");
        assert.strictEqual(farmComp.state, FarmState.Growing);

        const inventory = worker.getEcsComponent(InventoryComponentId)!;
        assert.strictEqual(inventory.items.length, 0, "no items should be added when farm is not Ready");
    });

    it("fails when farm building is not found", () => {
        const { worker } = createTestScene();
        const action = { type: "harvestCrop" as const, buildingId: "nonexistent" };

        const result = executeHarvestCropAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });

    it("fails when worker is not adjacent to farm", () => {
        const { worker, farm } = createTestScene();
        farm.worldPosition = { x: 25, y: 25 };

        const action = { type: "harvestCrop" as const, buildingId: "farm" };
        const result = executeHarvestCropAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });
});
