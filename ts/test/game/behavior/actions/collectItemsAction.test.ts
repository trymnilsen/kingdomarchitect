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
import { createGroundItemComponent } from "../../../../src/game/component/groundItemComponent.ts";
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

function stockChest(chest: Entity): void {
    const collectable = chest.requireEcsComponent(CollectableComponentId);
    addCollectableItem(collectable, { item: woodResourceItem, amount: 5 });
    addCollectableItem(collectable, { item: stoneResource, amount: 3 });
}

describe("collectItemsAction", () => {
    it("transfers the named stack and leaves the rest alone", () => {
        const { worker, chest } = createTestScene();
        stockChest(chest);

        const action = {
            type: "collectItems" as const,
            entityId: "chest",
            itemId: "wood",
        };
        const result = executeCollectItemsAction(action, worker);

        assert.strictEqual(result.kind, "complete");

        const held = worker.requireEcsComponent(HeldItemComponentId);
        assert.strictEqual(held.item?.id, "wood");
        assert.strictEqual(held.amount, 5);

        const collectable = chest.requireEcsComponent(CollectableComponentId);
        assert.strictEqual(collectable.items.length, 1);
        assert.strictEqual(collectable.items[0].item.id, "stone");
    });

    it("takes the type the job named, not whichever stack is first", () => {
        const { worker, chest } = createTestScene();
        stockChest(chest);

        // Wood is items[0]; naming stone must still fetch stone. Picking a type
        // at execution time is exactly what stranded the second output type.
        const action = {
            type: "collectItems" as const,
            entityId: "chest",
            itemId: "stone",
        };
        const result = executeCollectItemsAction(action, worker);

        assert.strictEqual(result.kind, "complete");

        const held = worker.requireEcsComponent(HeldItemComponentId);
        assert.strictEqual(held.item?.id, "stone");
        assert.strictEqual(held.amount, 3);

        const collectable = chest.requireEcsComponent(CollectableComponentId);
        assert.strictEqual(collectable.items.length, 1);
        assert.strictEqual(collectable.items[0].item.id, "wood");
    });

    it("removes a ground pile once its only stack is taken", () => {
        const { root, worker, chest } = createTestScene();
        chest.setEcsComponent(createGroundItemComponent(1));
        addCollectableItem(chest.requireEcsComponent(CollectableComponentId), {
            item: woodResourceItem,
            amount: 2,
        });

        const action = {
            type: "collectItems" as const,
            entityId: "chest",
            itemId: "wood",
        };
        executeCollectItemsAction(action, worker);

        assert.strictEqual(root.findEntity("chest"), null);
    });

    it("leaves a drained collectable that is not a ground pile", () => {
        const { root, worker, chest } = createTestScene();
        addCollectableItem(chest.requireEcsComponent(CollectableComponentId), {
            item: woodResourceItem,
            amount: 2,
        });

        const action = {
            type: "collectItems" as const,
            entityId: "chest",
            itemId: "wood",
        };
        executeCollectItemsAction(action, worker);

        // A pile exists only to hold its stack; anything else owns its own
        // lifetime, and draining it must never delete the host entity.
        assert.ok(root.findEntity("chest"));
    });

    it("fails instead of throwing when held cannot take the stack", () => {
        const { worker, chest } = createTestScene();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 1;
        addCollectableItem(chest.requireEcsComponent(CollectableComponentId), {
            item: stoneResource,
            amount: 3,
        });

        const action = {
            type: "collectItems" as const,
            entityId: "chest",
            itemId: "stone",
        };
        const result = executeCollectItemsAction(action, worker);

        assert.strictEqual(result.kind, "failed");
        assert.strictEqual(held.item?.id, "wood", "the load is untouched");
        assert.strictEqual(
            chest.requireEcsComponent(CollectableComponentId).items.length,
            1,
            "and so is the stack",
        );
    });

    it("completes without failing when the named stack is already gone", () => {
        const { worker, chest } = createTestScene();
        addCollectableItem(chest.requireEcsComponent(CollectableComponentId), {
            item: stoneResource,
            amount: 3,
        });

        // Another worker raced us to the wood between planning and arriving.
        const action = {
            type: "collectItems" as const,
            entityId: "chest",
            itemId: "wood",
        };
        const result = executeCollectItemsAction(action, worker);

        assert.strictEqual(result.kind, "complete");

        const held = worker.requireEcsComponent(HeldItemComponentId);
        assert.strictEqual(held.item, null, "the worker picks up nothing");

        const collectable = chest.requireEcsComponent(CollectableComponentId);
        assert.strictEqual(
            collectable.items.length,
            1,
            "somebody else's stack is untouched",
        );
    });

    it("fails if target entity not found", () => {
        const { worker } = createTestScene();
        const action = {
            type: "collectItems" as const,
            entityId: "nonexistent",
            itemId: "wood",
        };
        const result = executeCollectItemsAction(action, worker);
        assert.strictEqual(result.kind, "failed");
    });

    it("fails if worker not adjacent to target", () => {
        const { worker, chest } = createTestScene();
        chest.worldPosition = { x: 10, y: 10 };
        stockChest(chest);

        const action = {
            type: "collectItems" as const,
            entityId: "chest",
            itemId: "wood",
        };
        const result = executeCollectItemsAction(action, worker);
        assert.strictEqual(result.kind, "failed");
    });

    it("fails if target has no CollectableComponent", () => {
        const { root, worker } = createTestScene();
        const building = new Entity("building");
        building.worldPosition = { x: 11, y: 8 };
        root.addChild(building);

        const action = {
            type: "collectItems" as const,
            entityId: "building",
            itemId: "wood",
        };
        const result = executeCollectItemsAction(action, worker);
        assert.strictEqual(result.kind, "failed");
    });

    it("throws if worker has no held component", () => {
        const { root, chest } = createTestScene();
        const workerNoHeld = new Entity("workerNoHeld");
        workerNoHeld.worldPosition = { x: 10, y: 8 };
        root.addChild(workerNoHeld);
        stockChest(chest);

        const action = {
            type: "collectItems" as const,
            entityId: "chest",
            itemId: "wood",
        };
        assert.throws(() => {
            executeCollectItemsAction(action, workerNoHeld);
        });
    });
});
