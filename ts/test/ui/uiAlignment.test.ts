import { describe, it } from "node:test";
import assert from "node:assert";
import { calculateAlignment, uiAlignment } from "../../src/ui/uiAlignment.ts";

describe("UiAlignment", () => {
    it("collapses the offset to width-itemWidth when the item is larger than the target", () => {
        // 40x40 target, 100x100 item: the upper clamp bound (width - itemWidth)
        // is negative, and clamp collapses min to that bound, so the offset
        // settles at width - itemWidth (-60) rather than a half-overlap value.
        const result = calculateAlignment(40, 40, uiAlignment.center, 100, 100);
        assert.deepStrictEqual(result, { x: -60, y: -60 });
    });
});
