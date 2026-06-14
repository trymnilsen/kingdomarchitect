import assert from "node:assert";
import { describe, it } from "node:test";
import {
    clampScroll,
    scrollThumbMetrics,
} from "../../../src/ui/declarative/uiScrollView.ts";

describe("clampScroll", () => {
    it("clamps a negative offset to zero", () => {
        assert.strictEqual(clampScroll(-40, 400, 100), 0);
    });

    it("clamps past the end to the hidden content height", () => {
        // 400 of content, 100 visible -> 300 can scroll out of view.
        assert.strictEqual(clampScroll(500, 400, 100), 300);
    });

    it("passes through an in-range offset", () => {
        assert.strictEqual(clampScroll(120, 400, 100), 120);
    });

    it("pins to zero when the content fits the viewport", () => {
        assert.strictEqual(clampScroll(50, 100, 200), 0);
    });
});

describe("scrollThumbMetrics", () => {
    // track 200, viewport 100, content 400 -> thumb is a quarter of the track
    // (50px) and travels across the remaining 150px as it scrolls 0..300.
    it("sizes the thumb to the viewport fraction of the content", () => {
        const { height } = scrollThumbMetrics(200, 100, 400, 0);
        assert.strictEqual(height, 50);
    });

    it("keeps the thumb at the top at offset zero", () => {
        const { offset } = scrollThumbMetrics(200, 100, 400, 0);
        assert.strictEqual(offset, 0);
    });

    it("centers the thumb at the mid scroll position", () => {
        const { offset } = scrollThumbMetrics(200, 100, 400, 150);
        assert.strictEqual(offset, 75);
    });

    it("pins the thumb to the bottom at max scroll", () => {
        const { height, offset } = scrollThumbMetrics(200, 100, 400, 300);
        assert.strictEqual(offset, 200 - height);
    });

    it("enforces a minimum thumb height for tiny viewports", () => {
        const { height } = scrollThumbMetrics(200, 10, 1000, 0);
        assert.strictEqual(height, 12);
    });
});
