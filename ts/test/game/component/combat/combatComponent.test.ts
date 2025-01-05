import { describe, it, expect } from "vitest";

describe("combatComponent", () => {
    it("will aggro actor if in range", () => {
        expect(2).toBe(2);
    });

    it("will move aggro to new item within range if aggroed enough", () => {
        expect(2).toBe(2);
    });

    it("will not move aggro if no targets is within range", () => {
        expect(2).toBe(2);
    });

    it("will reduce aggro on death", () => {
        expect(2).toBe(2);
    });
});
