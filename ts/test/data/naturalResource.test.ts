import assert from "node:assert";
import { describe, it } from "node:test";
import {
    getResourcePathWeight,
    isDecorativeResource,
    isImpassableResource,
} from "../../src/data/inventory/items/naturalResource.ts";

describe("resource footprint", () => {
    describe("isDecorativeResource", () => {
        it("returns true for grass", () => {
            assert.strictEqual(isDecorativeResource("grass"), true);
        });

        it("returns false for blocking resources", () => {
            assert.strictEqual(isDecorativeResource("tree1"), false);
            assert.strictEqual(isDecorativeResource("stone1"), false);
        });

        it("returns false for unknown resource ids", () => {
            assert.strictEqual(isDecorativeResource("not-a-resource"), false);
        });
    });

    describe("getResourcePathWeight", () => {
        it("returns 0 for decorative resources", () => {
            assert.strictEqual(getResourcePathWeight("grass"), 0);
        });

        it("returns the blocking weight for blocking resources", () => {
            assert.strictEqual(getResourcePathWeight("tree1"), 30);
            assert.strictEqual(getResourcePathWeight("stone1"), 30);
        });

        it("returns the blocking weight for unknown resource ids", () => {
            assert.strictEqual(getResourcePathWeight("not-a-resource"), 30);
        });
    });

    it("decorative resources are never impassable", () => {
        assert.strictEqual(isImpassableResource("grass"), false);
    });
});
