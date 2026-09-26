import assert from "node:assert";
import { describe, it } from "node:test";
import { isImpassableResource } from "../../src/data/inventory/items/naturalResource.ts";

describe("resource footprint", () => {
    it("decorative resources are never impassable", () => {
        assert.strictEqual(isImpassableResource("grass"), false);
    });
});
