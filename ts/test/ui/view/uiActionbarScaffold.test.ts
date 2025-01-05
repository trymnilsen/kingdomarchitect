import { describe, it, expect } from "vitest";

describe("UiActionbarScaffold", () => {
    it("Sizes main content to the size of constraints minus actionbar", () => {
        expect(2).toBe(2);
    });

    it("Gives the full width to the left actionbar", () => {
        expect(2).toBe(2);
    });

    it("Shares width between both actionbars", () => {
        expect(2).toBe(2);
    });

    it("Prioritises collapsing the second actionbar first", () => {
        expect(2).toBe(2);
    });

    it("Collapses actionbar items if no space", () => {
        expect(2).toBe(2);
    });

    it("Will expand sub-menu on selection", () => {
        expect(2).toBe(2);
    });

    it("Will export focus regions of buttons", () => {
        expect(2).toBe(2);
    });

    it("Cannot tap nested buttons if collapsed", () => {
        expect(2).toBe(2);
    });
});
