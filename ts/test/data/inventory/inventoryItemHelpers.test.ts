import assert from "node:assert";
import { describe, it } from "node:test";
import { getInventoryItemById } from "../../../src/data/inventory/inventoryItemHelpers.ts";

describe("getInventoryItemById", () => {
    it("finds a raw resource", () => {
        const item = getInventoryItemById("wood");
        assert.strictEqual(item?.id, "wood");
    });

    it("finds a processed material", () => {
        // Regression: building materials like planks live outside `resources`,
        // so dismantle refunds silently dropped them when only resources were
        // searched.
        const item = getInventoryItemById("planks");
        assert.strictEqual(item?.id, "planks");
    });

    it("returns undefined for an unknown id", () => {
        assert.strictEqual(getInventoryItemById("does-not-exist"), undefined);
    });
});
