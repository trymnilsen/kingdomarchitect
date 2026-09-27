import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { planJob } from "../../../../src/game/job/planner/jobPlanner.ts";
import { CollectResourceJob } from "../../../../src/game/job/collectResourceJob.ts";
import { ResourceHarvestMode } from "../../../../src/data/inventory/items/naturalResource.ts";
import { createJobQueueComponent } from "../../../../src/game/component/jobQueueComponent.ts";
import { createInventoryComponent } from "../../../../src/game/component/inventoryComponent.ts";
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

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "dropHeld");
        assert.strictEqual(actions[1].type, "harvestResource");
    });

    it("prepends depositToStockpile when worker holds an item and an accepting stockpile exists", () => {
        const { root, worker } = createTestScene();
        const held = createHeldItemComponent();
        setHeldItem(held, wheatResourceItem, 3);
        worker.setEcsComponent(held);

        const stockpile = new Entity("stockpile");
        stockpile.worldPosition = { x: 12, y: 9 };
        const stockpileComp = createStockpileComponent(200);
        setPreferredAmount(stockpileComp, wheatResourceItem.id, 50);
        stockpile.setEcsComponent(stockpileComp);
        stockpile.setEcsComponent(createInventoryComponent());
        root.addChild(stockpile);

        const resource = new Entity("resource");
        resource.worldPosition = { x: 20, y: 13 };
        root.addChild(resource);

        const job = CollectResourceJob(resource, ResourceHarvestMode.Chop);
        const actions = planJob(root, worker, job, () => []);

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "depositToStockpile");
        assert.strictEqual(actions[1].type, "harvestResource");
        const deposit = actions[0] as {
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

        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].type, "harvestResource");
    });
});
