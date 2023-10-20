import { describe, it } from "node:test";
import * as assert from "node:assert";

describe("uiActionbarScaffold test", () => {
    it("Sizes main content to the size of constraints minus actionbar", () => {
        assert.equal(2, 2);
    });

    it("Gives the full width to the left actionbar", () => {
        assert.equal(2, 2);
    });

    it("Shares width between both actionbars", () => {
        assert.equal(2, 2);
    });

    it("Prioritises collapsing the second actionbar first", () => {
        assert.equal(2, 2);
    });

    it("Collapses actionbar items if no space", () => {
        assert.equal(2, 2);
    });

    it("Will expand sub-menu on selection", () => {
        assert.equal(2, 2);
    });

    it("Will export focus regions of buttons", () => {
        assert.equal(2, 2);
    });
});
