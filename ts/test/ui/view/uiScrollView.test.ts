import assert from "node:assert";
import { describe, it } from "node:test";
import {
    clampScroll,
    scrollThumbMetrics,
} from "../../../src/ui/declarative/uiScrollView.ts";

describe("clampScroll", () => {
    it("clamps past the end to the hidden content height", () => {
        // 400 of content, 100 visible -> 300 can scroll out of view.
        assert.strictEqual(clampScroll(500, 400, 100), 300);
    });
});

describe("scrollThumbMetrics", () => {
    it("enforces a minimum thumb height for tiny viewports", () => {
        const { height } = scrollThumbMetrics(200, 10, 1000, 0);
        assert.strictEqual(height, 12);
    });
});
