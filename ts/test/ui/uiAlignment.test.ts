import { describe, it } from "node:test";
import assert from "node:assert";
import { calculateAlignment, uiAlignment } from "../../src/ui/uiAlignment.ts";

describe("UiAlignment", () => {
    it("centers an item smaller than the target", () => {
        // 100x100 target, 40x40 item -> centered offset (30,30)
        const result = calculateAlignment(100, 100, uiAlignment.center, 40, 40);
        assert.deepStrictEqual(result, { x: 30, y: 30 });
    });

    it("places item at top left with topLeft alignment", () => {
        const result = calculateAlignment(
            100,
            100,
            uiAlignment.topLeft,
            40,
            40,
        );
        assert.deepStrictEqual(result, { x: 0, y: 0 });
    });

    it("places item at bottom right with bottomRight alignment", () => {
        const result = calculateAlignment(
            100,
            100,
            uiAlignment.bottomRight,
            40,
            40,
        );
        // item flush against bottom right: width-itemWidth = 60
        assert.deepStrictEqual(result, { x: 60, y: 60 });
    });

    it("centers horizontally and pins to top with topCenter alignment", () => {
        const result = calculateAlignment(
            100,
            100,
            uiAlignment.topCenter,
            40,
            40,
        );
        assert.deepStrictEqual(result, { x: 30, y: 0 });
    });

    it("collapses the offset to width-itemWidth when the item is larger than the target", () => {
        // 40x40 target, 100x100 item: the upper clamp bound (width - itemWidth)
        // is negative, and clamp collapses min to that bound, so the offset
        // settles at width - itemWidth (-60) rather than a half-overlap value.
        const result = calculateAlignment(40, 40, uiAlignment.center, 100, 100);
        assert.deepStrictEqual(result, { x: -60, y: -60 });
    });
});
