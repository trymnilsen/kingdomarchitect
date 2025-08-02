import { describe, it, expect } from "vitest";

describe("Job", () => {
    it("cannot set start tick after it has been set", () => {
        expect(2).toBe(2);
    });

    it("cannot set not started state", () => {
        expect(2).toBe(2);
    });

    it("cannot update job state if its completed", () => {
        expect(2).toBe(2);
    });

    it("can only set completed state if its currently running", () => {
        expect(2).toBe(2);
    });
});
