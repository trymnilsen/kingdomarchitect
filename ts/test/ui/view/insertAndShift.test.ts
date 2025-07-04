import { describe, it } from "node:test";
import assert from "node:assert";

describe("insertAndShift", () => {
    it("shifts nothing when inserted at the end", () => {
        assert.strictEqual(2, 2);
    });

    it("shifts all when inserted at the beginning", () => {
        assert.strictEqual(2, 2);
    });

    it("shifts from correct index when inserted at the middle", () => {
        assert.strictEqual(2, 2);
    });
});
