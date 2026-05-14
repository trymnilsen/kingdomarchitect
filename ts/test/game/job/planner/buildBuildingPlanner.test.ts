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
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../../src/game/component/heldItemComponent.ts";
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

    worker.setEcsComponent(createHeldItemComponent());
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

            const buildingInventory = building.getEcsComponent("Inventory")!;
            addInventoryItem(buildingInventory, woodResourceItem, 20);

            const job = BuildBuildingJob(building);
            const actions = planBuildBuilding(root, worker, job);

            assert.strictEqual(actions.length, 2);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "constructBuilding");
        });
    });

    describe("State 2: Worker held matches a needed material", () => {
        it("returns moveTo + depositToInventory carrying held's item id", () => {
            const { root, worker, building } = createTestScene();

            const held = worker.requireEcsComponent(HeldItemComponentId);
            held.item = woodResourceItem;
            held.amount = 7;

            const job = BuildBuildingJob(building);
            const actions = planBuildBuilding(root, worker, job);

            assert.strictEqual(actions.length, 2);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "depositToInventory");

            const depositAction = actions[1] as {
                type: "depositToInventory";
                targetEntityId: string;
                itemId?: string;
            };
            assert.strictEqual(depositAction.itemId, "wood");
            assert.strictEqual(depositAction.targetEntityId, "building");
        });
    });

    describe("State 3: Need to fetch from stockpile (held empty)", () => {
        it("returns moveTo + withdrawFromStockpile + moveTo + deposit", () => {
            const { root, worker, stockpile } = createTestScene();

            const stockpileInventory = stockpile.getEcsComponent("Inventory")!;
            addInventoryItem(stockpileInventory, woodResourceItem, 30);

            const job = BuildBuildingJob({ id: "building" } as Entity);
            const actions = planBuildBuilding(root, worker, job);

            assert.strictEqual(actions.length, 4);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "withdrawFromStockpile");
            assert.strictEqual(actions[2].type, "moveTo");
            assert.strictEqual(actions[3].type, "depositToInventory");
        });

        it("withdraw moves to the stockpile position", () => {
            const { root, worker, stockpile } = createTestScene();

            const stockpileInventory = stockpile.getEcsComponent("Inventory")!;
            addInventoryItem(stockpileInventory, woodResourceItem, 30);

            const job = BuildBuildingJob({ id: "building" } as Entity);
            const actions = planBuildBuilding(root, worker, job);

            const moveAction = actions[0] as {
                type: "moveTo";
                target: { x: number; y: number };
            };
            assert.strictEqual(moveAction.target.x, 20);
            assert.strictEqual(moveAction.target.y, 8);
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

        it("returns empty array if worker has no held component", () => {
            const { root, building } = createTestScene();
            const workerNoHeld = new Entity("workerNoHeld");
            workerNoHeld.worldPosition = { x: 10, y: 8 };
            root.addChild(workerNoHeld);

            const job = BuildBuildingJob(building);
            const actions = planBuildBuilding(root, workerNoHeld, job);
            assert.strictEqual(actions.length, 0);
        });
    });
});
