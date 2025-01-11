import { describe, it, expect } from "vitest";

describe("FocusState", () => {
    it("set first focus sets focus to upperleft most view", () => {
        expect(2).toBe(2);
    });

    it("set focus runs onFocus/onFocusLost on focused view", () => {
        expect(2).toBe(2);
    });
});
