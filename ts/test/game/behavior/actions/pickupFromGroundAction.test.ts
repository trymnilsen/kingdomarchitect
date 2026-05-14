import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createCollectableComponent,
    addCollectableItem,
} from "../../../../src/game/component/collectableComponent.ts";
import { createGroundItemComponent } from "../../../../src/game/component/groundItemComponent.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../../src/game/component/heldItemComponent.ts";
import { executePickupFromGroundAction } from "../../../../src/game/behavior/actions/pickupFromGroundAction.ts";
import {
    woodResourceItem,
    stoneResource,
} from "../../../../src/data/inventory/items/resources.ts";

function createScene(): { root: Entity; worker: Entity; pile: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");
    worker.worldPosition = { x: 5, y: 5 };
    worker.setEcsComponent(createHeldItemComponent());

    const pile = new Entity("pile");
    pile.worldPosition = { x: 6, y: 5 };
    pile.setEcsComponent(createCollectableComponent());
    pile.setEcsComponent(createGroundItemComponent());

    root.addChild(worker);
    root.addChild(pile);
    return { root, worker, pile };
}

describe("pickupFromGroundAction", () => {
    it("transfers pile contents into empty held and removes the pile", () => {
        const { root, worker, pile } = createScene();
        const collectable = pile.requireEcsComponent("Collectable");
        addCollectableItem(collectable, { item: woodResourceItem, amount: 4 });

        const result = executePickupFromGroundAction(
            { type: "pickupFromGround", pileEntityId: "pile" },
            worker,
        );
        assert.strictEqual(result.kind, "complete");

        const held = worker.requireEcsComponent(HeldItemComponentId);
        assert.strictEqual(held.item?.id, "wood");
        assert.strictEqual(held.amount, 4);
        assert.strictEqual(root.findEntity("pile"), null);
    });

    it("stacks onto held when held holds the same item id", () => {
        const { worker, pile } = createScene();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 1;

        const collectable = pile.requireEcsComponent("Collectable");
        addCollectableItem(collectable, { item: woodResourceItem, amount: 3 });

        const result = executePickupFromGroundAction(
            { type: "pickupFromGround", pileEntityId: "pile" },
            worker,
        );
        assert.strictEqual(result.kind, "complete");
        assert.strictEqual(held.amount, 4);
    });

    it("fails when held has a different item id", () => {
        const { worker, pile } = createScene();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = stoneResource;
        held.amount = 1;

        const collectable = pile.requireEcsComponent("Collectable");
        addCollectableItem(collectable, { item: woodResourceItem, amount: 3 });

        const result = executePickupFromGroundAction(
            { type: "pickupFromGround", pileEntityId: "pile" },
            worker,
        );
        assert.strictEqual(result.kind, "failed");
        assert.strictEqual(held.item?.id, "stone");
        assert.strictEqual(held.amount, 1);
    });

    it("fails when worker is not adjacent to pile", () => {
        const { worker, pile } = createScene();
        pile.worldPosition = { x: 20, y: 20 };

        const collectable = pile.requireEcsComponent("Collectable");
        addCollectableItem(collectable, { item: woodResourceItem, amount: 1 });

        const result = executePickupFromGroundAction(
            { type: "pickupFromGround", pileEntityId: "pile" },
            worker,
        );
        assert.strictEqual(result.kind, "failed");
    });

    it("fails when pile entity is missing", () => {
        const { worker } = createScene();
        const result = executePickupFromGroundAction(
            { type: "pickupFromGround", pileEntityId: "nonexistent" },
            worker,
        );
        assert.strictEqual(result.kind, "failed");
    });
});
