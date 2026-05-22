import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { planJob } from "../../../../src/game/job/planner/jobPlanner.ts";
import { CollectResourceJob } from "../../../../src/game/job/collectResourceJob.ts";
import { createProductionJob } from "../../../../src/game/job/productionJob.ts";
import { CollectItemJob } from "../../../../src/game/job/collectItemJob.ts";
import { MoveToJob } from "../../../../src/game/job/moveToPointJob.ts";
import { ResourceHarvestMode } from "../../../../src/data/inventory/items/naturalResource.ts";
import { createJobQueueComponent } from "../../../../src/game/component/jobQueueComponent.ts";
import { createInventoryComponent } from "../../../../src/game/component/inventoryComponent.ts";
import { createProductionComponent } from "../../../../src/game/component/productionComponent.ts";
import {
    createHeldItemComponent,
    setHeldItem,
} from "../../../../src/game/component/heldItemComponent.ts";
import {
    createStockpileComponent,
    setPreferredAmount,
} from "../../../../src/game/component/stockpileComponent.ts";
import { wheatResourceItem } from "../../../../src/data/inventory/items/resources.ts";

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
        building.setEcsComponent(
            createProductionComponent("quarry_production", 4),
        );
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

    it("handles moveToJob directly", () => {
        const { root, worker } = createTestScene();

        const job = MoveToJob(worker, { x: 10, y: 15 });
        const actions = planJob(root, worker, job, () => []);

        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].type, "moveTo");
        const moveAction = actions[0] as {
            type: "moveTo";
            target: { x: number; y: number };
        };
        assert.strictEqual(moveAction.target.x, 10);
        assert.strictEqual(moveAction.target.y, 15);
    });

    it("returns empty array for unknown job type", () => {
        const { root, worker } = createTestScene();

        const unknownJob = { id: "unknownJob" } as any;
        const actions = planJob(root, worker, unknownJob, () => []);

        assert.strictEqual(actions.length, 0);
    });

    it("prepends dropHeld when worker holds something and no stockpile accepts it", () => {
        const { root, worker } = createTestScene();
        const held = createHeldItemComponent();
        setHeldItem(held, wheatResourceItem, 3);
        worker.setEcsComponent(held);

        const resource = new Entity("resource");
        resource.worldPosition = { x: 15, y: 13 };
        root.addChild(resource);

        const job = CollectResourceJob(resource, ResourceHarvestMode.Chop);
        const actions = planJob(root, worker, job, () => []);

        assert.strictEqual(actions.length, 3);
        assert.strictEqual(actions[0].type, "dropHeld");
        assert.strictEqual(actions[1].type, "moveTo");
        assert.strictEqual(actions[2].type, "harvestResource");
    });

    it("prepends moveTo+depositToStockpile when worker holds an item and an accepting stockpile exists", () => {
        const { root, worker } = createTestScene();
        const held = createHeldItemComponent();
        setHeldItem(held, wheatResourceItem, 3);
        worker.setEcsComponent(held);

        const stockpile = new Entity("stockpile");
        stockpile.worldPosition = { x: 12, y: 9 };
        const stockpileComp = createStockpileComponent();
        setPreferredAmount(stockpileComp, wheatResourceItem.id, 50);
        stockpile.setEcsComponent(stockpileComp);
        stockpile.setEcsComponent(createInventoryComponent());
        root.addChild(stockpile);

        const resource = new Entity("resource");
        resource.worldPosition = { x: 20, y: 13 };
        root.addChild(resource);

        const job = CollectResourceJob(resource, ResourceHarvestMode.Chop);
        const actions = planJob(root, worker, job, () => []);

        assert.strictEqual(actions.length, 4);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "depositToStockpile");
        assert.strictEqual(actions[2].type, "moveTo");
        assert.strictEqual(actions[3].type, "harvestResource");
        const deposit = actions[1] as {
            type: "depositToStockpile";
            stockpileId: string;
        };
        assert.strictEqual(deposit.stockpileId, "stockpile");
    });

    it("does not prepend deposit when worker held is empty", () => {
        const { root, worker } = createTestScene();
        worker.setEcsComponent(createHeldItemComponent());

        const resource = new Entity("resource");
        resource.worldPosition = { x: 15, y: 13 };
        root.addChild(resource);

        const job = CollectResourceJob(resource, ResourceHarvestMode.Chop);
        const actions = planJob(root, worker, job, () => []);

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "harvestResource");
    });

    it("does not prepend deposit for non-held-writing jobs", () => {
        const { root, worker } = createTestScene();
        const held = createHeldItemComponent();
        setHeldItem(held, wheatResourceItem, 3);
        worker.setEcsComponent(held);

        const job = MoveToJob(worker, { x: 10, y: 15 });
        const actions = planJob(root, worker, job, () => []);

        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].type, "moveTo");
    });
});
