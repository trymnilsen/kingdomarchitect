import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { planBuildBuilding } from "../../../../src/game/job/planner/buildBuildingPlanner.ts";
import { BuildBuildingJob } from "../../../../src/game/job/buildBuildingJob.ts";
import { createJobQueueComponent } from "../../../../src/game/component/jobQueueComponent.ts";
import {
    createInventoryComponent,
    addInventoryItem,
} from "../../../../src/game/component/inventoryComponent.ts";
import { createBuildingComponent } from "../../../../src/game/component/buildingComponent.ts";
import { createStockpileComponent } from "../../../../src/game/component/stockpileComponent.ts";
import { woodenHouse } from "../../../../src/data/building/wood/house.ts";
import { woodResourceItem } from "../../../../src/data/inventory/items/resources.ts";

function createTestScene(): {
    root: Entity;
    worker: Entity;
    building: Entity;
    stockpile: Entity;
} {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const building = new Entity("building");
    const stockpile = new Entity("stockpile");

    worker.worldPosition = { x: 10, y: 8 };
    building.worldPosition = { x: 15, y: 13 };
    stockpile.worldPosition = { x: 20, y: 8 };

    worker.setEcsComponent(createInventoryComponent());
    building.setEcsComponent(createBuildingComponent(woodenHouse, true));
    building.setEcsComponent(createInventoryComponent());

    stockpile.setEcsComponent(createStockpileComponent());
    stockpile.setEcsComponent(createInventoryComponent());

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);
    root.addChild(building);
    root.addChild(stockpile);

    return { root, worker, building, stockpile };
}

describe("buildBuildingPlanner", () => {
    describe("State 1: Building has all materials", () => {
        it("returns moveTo and constructBuilding actions", () => {
            const { root, worker, building } = createTestScene();

            // Give building all required materials (20 wood for woodenHouse)
            const buildingInventory = building.getEcsComponent("Inventory")!;
            addInventoryItem(buildingInventory, woodResourceItem, 20);

            const job = BuildBuildingJob(building);
            const actions = planBuildBuilding(root, worker, job);

            assert.strictEqual(actions.length, 2);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "constructBuilding");
        });

        it("sets correct entityId for constructBuilding action", () => {
            const { root, worker, building } = createTestScene();

            const buildingInventory = building.getEcsComponent("Inventory")!;
            addInventoryItem(buildingInventory, woodResourceItem, 20);

            const job = BuildBuildingJob(building);
            const actions = planBuildBuilding(root, worker, job);

            const constructAction = actions[1] as { type: "constructBuilding"; entityId: string };
            assert.strictEqual(constructAction.entityId, "building");
        });
    });

    describe("State 2: Worker has needed materials", () => {
        it("returns moveTo and depositToInventory actions", () => {
            const { root, worker, building } = createTestScene();

            // Worker has materials, building needs them
            const workerInventory = worker.getEcsComponent("Inventory")!;
            addInventoryItem(workerInventory, woodResourceItem, 20);

            const job = BuildBuildingJob(building);
            const actions = planBuildBuilding(root, worker, job);

            assert.strictEqual(actions.length, 2);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "depositToInventory");
        });

        it("deposits correct amount of materials", () => {
            const { root, worker, building } = createTestScene();

            // Worker has 25 wood, building needs 20
            const workerInventory = worker.getEcsComponent("Inventory")!;
            addInventoryItem(workerInventory, woodResourceItem, 25);

            const job = BuildBuildingJob(building);
            const actions = planBuildBuilding(root, worker, job);

            const depositAction = actions[1] as {
                type: "depositToInventory";
                items: Array<{ itemId: string; amount: number }>;
            };

            const woodDeposit = depositAction.items.find((i) => i.itemId === "wood");
            assert.ok(woodDeposit);
            assert.strictEqual(woodDeposit.amount, 20);
        });

        it("deposits only what is still needed", () => {
            const { root, worker, building } = createTestScene();

            // Building already has 15 wood, needs 20 total
            const buildingInventory = building.getEcsComponent("Inventory")!;
            addInventoryItem(buildingInventory, woodResourceItem, 15);

            // Worker has 10 wood
            const workerInventory = worker.getEcsComponent("Inventory")!;
            addInventoryItem(workerInventory, woodResourceItem, 10);

            const job = BuildBuildingJob(building);
            const actions = planBuildBuilding(root, worker, job);

            const depositAction = actions[1] as {
                type: "depositToInventory";
                items: Array<{ itemId: string; amount: number }>;
            };

            const woodDeposit = depositAction.items.find((i) => i.itemId === "wood");
            assert.ok(woodDeposit);
            assert.strictEqual(woodDeposit.amount, 5); // Only need 5 more
        });
    });

    describe("State 3: Need to fetch from stockpile", () => {
        it("returns moveTo and takeFromInventory actions", () => {
            const { root, worker, stockpile } = createTestScene();

            // Stockpile has materials
            const stockpileInventory = stockpile.getEcsComponent("Inventory")!;
            addInventoryItem(stockpileInventory, woodResourceItem, 30);

            const job = BuildBuildingJob({ id: "building" } as Entity);
            const actions = planBuildBuilding(root, worker, job);

            assert.strictEqual(actions.length, 2);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "takeFromInventory");
        });

        it("moves to stockpile position", () => {
            const { root, worker, stockpile } = createTestScene();

            const stockpileInventory = stockpile.getEcsComponent("Inventory")!;
            addInventoryItem(stockpileInventory, woodResourceItem, 30);

            const job = BuildBuildingJob({ id: "building" } as Entity);
            const actions = planBuildBuilding(root, worker, job);

            const moveAction = actions[0] as { type: "moveTo"; target: { x: number; y: number } };
            assert.strictEqual(moveAction.target.x, 20);
            assert.strictEqual(moveAction.target.y, 8);
        });
    });

    describe("State 4: No materials available", () => {
        it("returns empty array when no materials in stockpiles", () => {
            const { root, worker } = createTestScene();

            // No materials anywhere
            const job = BuildBuildingJob({ id: "building" } as Entity);
            const actions = planBuildBuilding(root, worker, job);

            assert.strictEqual(actions.length, 0);
        });
    });

    describe("error cases", () => {
        it("returns empty array if building not found", () => {
            const { root, worker } = createTestScene();

            const job: ReturnType<typeof BuildBuildingJob> = {
                id: "buildBuildingJob",
                entityId: "nonexistent",
            };

            const actions = planBuildBuilding(root, worker, job);

            assert.strictEqual(actions.length, 0);
        });

        it("returns empty array if building has no BuildingComponent", () => {
            const { root, worker } = createTestScene();
            const noBuildingComp = new Entity("noBuildingComp");
            noBuildingComp.worldPosition = { x: 5, y: 5 };
            noBuildingComp.setEcsComponent(createInventoryComponent());
            root.addChild(noBuildingComp);

            const job = BuildBuildingJob(noBuildingComp);
            const actions = planBuildBuilding(root, worker, job);

            assert.strictEqual(actions.length, 0);
        });

        it("returns empty array if worker has no inventory", () => {
            const { root, building } = createTestScene();
            const workerNoInv = new Entity("workerNoInv");
            workerNoInv.worldPosition = { x: 10, y: 8 };
            root.addChild(workerNoInv);

            const job = BuildBuildingJob(building);
            const actions = planBuildBuilding(root, workerNoInv, job);

            assert.strictEqual(actions.length, 0);
        });

        it("returns empty array if building has no inventory", () => {
            const { root, worker } = createTestScene();
            const buildingNoInv = new Entity("buildingNoInv");
            buildingNoInv.worldPosition = { x: 5, y: 5 };
            buildingNoInv.setEcsComponent(createBuildingComponent(woodenHouse, true));
            root.addChild(buildingNoInv);

            const job = BuildBuildingJob(buildingNoInv);
            const actions = planBuildBuilding(root, worker, job);

            assert.strictEqual(actions.length, 0);
        });
    });
});
