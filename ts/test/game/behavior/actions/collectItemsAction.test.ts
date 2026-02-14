import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createInventoryComponent,
    getInventoryItem,
    InventoryComponentId,
} from "../../../../src/game/component/inventoryComponent.ts";
import {
    createCollectableComponent,
    addCollectableItem,
    CollectableComponentId,
} from "../../../../src/game/component/collectableComponent.ts";
import { executeCollectItemsAction } from "../../../../src/game/behavior/actions/collectItemsAction.ts";
import {
    woodResourceItem,
    stoneResource,
} from "../../../../src/data/inventory/items/resources.ts";

function createTestScene(): { root: Entity; worker: Entity; chest: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const chest = new Entity("chest");

    worker.worldPosition = { x: 10, y: 8 };
    chest.worldPosition = { x: 11, y: 8 }; // Adjacent

    worker.setEcsComponent(createInventoryComponent());
    chest.setEcsComponent(createCollectableComponent());

    root.addChild(worker);
    root.addChild(chest);

    return { root, worker, chest };
}

describe("collectItemsAction", () => {
    it("collects all items from collectable component", () => {
        const { worker, chest } = createTestScene();

        const collectableComponent = chest.getEcsComponent(CollectableComponentId)!;
        addCollectableItem(collectableComponent, { item: woodResourceItem, amount: 5 });
        addCollectableItem(collectableComponent, { item: stoneResource, amount: 3 });

        const action = {
            type: "collectItems" as const,
            entityId: "chest",
        };

        const result = executeCollectItemsAction(action, worker);

        assert.strictEqual(result, "complete");

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        assert.strictEqual(getInventoryItem(workerInventory, "wood")?.amount, 5);
        assert.strictEqual(getInventoryItem(workerInventory, "stone")?.amount, 3);

        // Collectable should be empty
        assert.strictEqual(collectableComponent.items.length, 0);
    });

    it("completes even if collectable is empty", () => {
        const { worker } = createTestScene();

        const action = {
            type: "collectItems" as const,
            entityId: "chest",
        };

        const result = executeCollectItemsAction(action, worker);

        assert.strictEqual(result, "complete");
    });

    it("fails if target entity not found", () => {
        const { worker } = createTestScene();

        const action = {
            type: "collectItems" as const,
            entityId: "nonexistent",
        };

        const result = executeCollectItemsAction(action, worker);

        assert.strictEqual(result, "failed");
    });

    it("fails if worker not adjacent to target", () => {
        const { worker, chest } = createTestScene();
        chest.worldPosition = { x: 10, y: 10 }; // Not adjacent

        const collectableComponent = chest.getEcsComponent(CollectableComponentId)!;
        addCollectableItem(collectableComponent, { item: woodResourceItem, amount: 5 });

        const action = {
            type: "collectItems" as const,
            entityId: "chest",
        };

        const result = executeCollectItemsAction(action, worker);

        assert.strictEqual(result, "failed");
    });

    it("fails if target has no CollectableComponent", () => {
        const { root, worker } = createTestScene();
        const building = new Entity("building");
        building.worldPosition = { x: 11, y: 8 };
        root.addChild(building);

        const action = {
            type: "collectItems" as const,
            entityId: "building",
        };

        const result = executeCollectItemsAction(action, worker);

        assert.strictEqual(result, "failed");
    });

    it("throws if worker has no inventory", () => {
        const { root, chest } = createTestScene();
        const workerNoInv = new Entity("workerNoInv");
        workerNoInv.worldPosition = { x: 10, y: 8 };
        root.addChild(workerNoInv);

        const collectableComponent = chest.getEcsComponent(CollectableComponentId)!;
        addCollectableItem(collectableComponent, { item: woodResourceItem, amount: 5 });

        const action = {
            type: "collectItems" as const,
            entityId: "chest",
        };

        assert.throws(() => {
            executeCollectItemsAction(action, workerNoInv);
        });
    });
});
