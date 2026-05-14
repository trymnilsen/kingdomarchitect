import assert from "node:assert";
import { describe, it } from "node:test";
import {
    addToHeldItem,
    createHeldItemComponent,
    setHeldItem,
} from "../../../src/game/component/heldItemComponent.ts";
import {
    woodResourceItem,
    stoneResource,
} from "../../../src/data/inventory/items/resources.ts";

describe("heldItemComponent", () => {
    it("setHeldItem replaces a same-id stack with the new amount", () => {
        const held = createHeldItemComponent();
        setHeldItem(held, woodResourceItem, 5);
        setHeldItem(held, woodResourceItem, 2);
        assert.strictEqual(held.amount, 2);
    });

    it("setHeldItem throws when held holds a different item id", () => {
        const held = createHeldItemComponent();
        setHeldItem(held, woodResourceItem, 5);
        assert.throws(() => setHeldItem(held, stoneResource, 1));
    });

    it("addToHeldItem stacks same item id", () => {
        const held = createHeldItemComponent();
        addToHeldItem(held, woodResourceItem, 3);
        addToHeldItem(held, woodResourceItem, 4);
        assert.strictEqual(held.amount, 7);
    });

    it("addToHeldItem throws on different item id", () => {
        const held = createHeldItemComponent();
        addToHeldItem(held, woodResourceItem, 3);
        assert.throws(() => addToHeldItem(held, stoneResource, 1));
    });
});
