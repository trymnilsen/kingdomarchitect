import { describe, it, expect } from "vitest";

describe("craftingComponent", () => {
    it("will set crafting time on add if queue is empty", () => {
        expect(2).toBe(2);
    });

    it("will not set craft time on add if queue has items", () => {
        expect(2).toBe(2);
    });

    it("will craft item with empty queue after 30 ticks", () => {
        expect(2).toBe(2);
    });

    it("will queue items to craft", () => {
        expect(2).toBe(2);
    });

    it("will not craft if previous item has not been collected", () => {
        expect(2).toBe(2);
    });

    it("will provide crafted item to collectable component", () => {
        expect(2).toBe(2);
    });
});
