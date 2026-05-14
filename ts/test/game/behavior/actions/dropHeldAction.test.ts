import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../../src/game/component/heldItemComponent.ts";
import {
    CollectableComponentId,
    hasCollectableItems,
} from "../../../../src/game/component/collectableComponent.ts";
import { GroundItemComponentId } from "../../../../src/game/component/groundItemComponent.ts";
import { executeDropHeldAction } from "../../../../src/game/behavior/actions/dropHeldAction.ts";
import { woodResourceItem } from "../../../../src/data/inventory/items/resources.ts";
import { createMinimalWorld } from "../../testWorld.ts";

function setupScene(): { root: Entity; worker: Entity } {
    const { root } = createMinimalWorld();
    const worker = new Entity("worker");
    worker.setEcsComponent(createHeldItemComponent());
    root.addChild(worker);
    worker.worldPosition = { x: 5, y: 5 };
    return { root, worker };
}

describe("dropHeldAction", () => {
    it("returns complete with no work when held is empty", () => {
        const { worker } = setupScene();
        const result = executeDropHeldAction({ type: "dropHeld" }, worker);
        assert.strictEqual(result.kind, "complete");
    });

    it("spawns a ground pile at the worker's tile when destination omitted", () => {
        const { root, worker } = setupScene();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 4;

        const result = executeDropHeldAction({ type: "dropHeld" }, worker);
        assert.strictEqual(result.kind, "complete");
        assert.strictEqual(held.item, null);
        assert.strictEqual(held.amount, 0);

        const piles = root.queryComponents(GroundItemComponentId);
        assert.strictEqual(piles.size, 1);
        const [[pile, _]] = piles;
        const collectable = pile.requireEcsComponent(CollectableComponentId);
        assert.ok(hasCollectableItems(collectable));
        assert.strictEqual(collectable.items[0].item.id, "wood");
        assert.strictEqual(collectable.items[0].amount, 4);
    });

    it("fails when destination is set and the worker is not there", () => {
        const { worker } = setupScene();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 1;

        const result = executeDropHeldAction(
            { type: "dropHeld", destination: { x: 99, y: 99 } },
            worker,
        );
        assert.strictEqual(result.kind, "failed");
        assert.strictEqual(held.amount, 1);
    });
});
