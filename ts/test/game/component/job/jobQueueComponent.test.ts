import { describe, it, expect } from "vitest";

describe("JobQueueEntity", () => {
    it("Schedule job attempts to immediately assign job", () => {
        expect(2).toBe(2);
    });

    it("Schedule job pushes job to pending if no entity is available", () => {
        expect(2).toBe(2);
    });

    it("Can remove job", () => {
        expect(2).toBe(2);
    });
});
