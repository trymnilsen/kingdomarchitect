import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../../src/game/component/heldItemComponent.ts";
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
    chest.worldPosition = { x: 11, y: 8 };

    worker.setEcsComponent(createHeldItemComponent());
    chest.setEcsComponent(createCollectableComponent());

    root.addChild(worker);
    root.addChild(chest);

    return { root, worker, chest };
}

describe("collectItemsAction", () => {
    it("transfers a single item id from collectable into empty held", () => {
        const { worker, chest } = createTestScene();

        const collectableComponent = chest.getEcsComponent(
            CollectableComponentId,
        )!;
        addCollectableItem(collectableComponent, {
            item: woodResourceItem,
            amount: 5,
        });
        addCollectableItem(collectableComponent, {
            item: stoneResource,
            amount: 3,
        });

        const action = { type: "collectItems" as const, entityId: "chest" };
        const result = executeCollectItemsAction(action, worker);

        assert.strictEqual(result.kind, "complete");

        const held = worker.getEcsComponent(HeldItemComponentId)!;
        assert.strictEqual(held.item?.id, "wood");
        assert.strictEqual(held.amount, 5);

        // Stone stays on the collectable; chest is not removed because the
        // collectable still has items.
        assert.strictEqual(collectableComponent.items.length, 1);
        assert.strictEqual(collectableComponent.items[0].item.id, "stone");
    });

    it("only transfers items matching held when held is occupied", () => {
        const { worker, chest } = createTestScene();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 2;

        const collectableComponent = chest.getEcsComponent(
            CollectableComponentId,
        )!;
        addCollectableItem(collectableComponent, {
            item: woodResourceItem,
            amount: 4,
        });
        addCollectableItem(collectableComponent, {
            item: stoneResource,
            amount: 3,
        });

        const action = { type: "collectItems" as const, entityId: "chest" };
        const result = executeCollectItemsAction(action, worker);

        assert.strictEqual(result.kind, "complete");
        assert.strictEqual(held.item?.id, "wood");
        assert.strictEqual(held.amount, 6);
        assert.strictEqual(collectableComponent.items.length, 1);
        assert.strictEqual(collectableComponent.items[0].item.id, "stone");
    });

    it("completes even if collectable is empty", () => {
        const { worker } = createTestScene();
        const action = { type: "collectItems" as const, entityId: "chest" };
        const result = executeCollectItemsAction(action, worker);
        assert.strictEqual(result.kind, "complete");
    });

    it("fails if target entity not found", () => {
        const { worker } = createTestScene();
        const action = {
            type: "collectItems" as const,
            entityId: "nonexistent",
        };
        const result = executeCollectItemsAction(action, worker);
        assert.strictEqual(result.kind, "failed");
    });

    it("fails if worker not adjacent to target", () => {
        const { worker, chest } = createTestScene();
        chest.worldPosition = { x: 10, y: 10 };

        const collectableComponent = chest.getEcsComponent(
            CollectableComponentId,
        )!;
        addCollectableItem(collectableComponent, {
            item: woodResourceItem,
            amount: 5,
        });

        const action = { type: "collectItems" as const, entityId: "chest" };
        const result = executeCollectItemsAction(action, worker);
        assert.strictEqual(result.kind, "failed");
    });

    it("fails if target has no CollectableComponent", () => {
        const { root, worker } = createTestScene();
        const building = new Entity("building");
        building.worldPosition = { x: 11, y: 8 };
        root.addChild(building);

        const action = { type: "collectItems" as const, entityId: "building" };
        const result = executeCollectItemsAction(action, worker);
        assert.strictEqual(result.kind, "failed");
    });

    it("throws if worker has no held component", () => {
        const { root, chest } = createTestScene();
        const workerNoHeld = new Entity("workerNoHeld");
        workerNoHeld.worldPosition = { x: 10, y: 8 };
        root.addChild(workerNoHeld);

        const collectableComponent = chest.getEcsComponent(
            CollectableComponentId,
        )!;
        addCollectableItem(collectableComponent, {
            item: woodResourceItem,
            amount: 5,
        });

        const action = { type: "collectItems" as const, entityId: "chest" };
        assert.throws(() => {
            executeCollectItemsAction(action, workerNoHeld);
        });
    });
});
