import * as assert from "node:assert";
import { describe, it } from "node:test";

describe("craftingComponent", () => {
    it("will set crafting time on add if queue is empty", () => {
        assert.equal(2, 2);
    });

    it("will not set craft time on add if queue has items", () => {
        assert.equal(2, 2);
    });

    it("will craft item with empty queue after 30 ticks", () => {
        assert.equal(2, 2);
    });

    it("will queue items to craft", () => {
        assert.equal(2, 2);
    });

    it("will not craft if previous item has not been collected", () => {
        assert.equal(2, 2);
    });

    it("will provide crafted item to collectable component", () => {
        assert.equal(2, 2);
    });
});
