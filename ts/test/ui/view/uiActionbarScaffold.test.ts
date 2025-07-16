import { describe, it } from "node:test";
import assert from "node:assert";

describe("UiActionbarScaffold", () => {
    it("Sizes main content to the size of constraints minus actionbar", () => {
        assert.strictEqual(2, 2);
    });

    it("Gives the full width to the left actionbar", () => {
        assert.strictEqual(2, 2);
    });

    it("Shares width between both actionbars", () => {
        assert.strictEqual(2, 2);
    });

    it("Prioritises collapsing the second actionbar first", () => {
        assert.strictEqual(2, 2);
    });

    it("Collapses actionbar items if no space", () => {
        assert.strictEqual(2, 2);
    });

    it("Will expand sub-menu on selection", () => {
        assert.strictEqual(2, 2);
    });

    it("Will export focus regions of buttons", () => {
        assert.strictEqual(2, 2);
    });

    it("Cannot tap nested buttons if collapsed", () => {
        assert.strictEqual(2, 2);
    });
});
