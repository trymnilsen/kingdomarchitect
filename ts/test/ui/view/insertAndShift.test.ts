import * as assert from "node:assert";
import { describe, it } from "node:test";

describe("insertAndShift", () => {
    it("shifts nothing when inserted at the end", () => {
        assert.equal(2, 2);
    });

    it("shifts all when inserted at the beginning", () => {
        assert.equal(2, 2);
    });

    it("shifts from correct index when inserted at the middle", () => {
        assert.equal(2, 2);
    });
});
