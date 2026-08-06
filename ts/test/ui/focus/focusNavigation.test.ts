import { describe, it } from "node:test";
import assert from "node:assert";
import { getClosestFocusableNode } from "../../../src/ui/focus/focusNavigation.ts";
import type { FocusNode } from "../../../src/ui/focus/focusNode.ts";
import type { Bounds } from "../../../src/common/bounds.ts";
import { Direction } from "../../../src/common/direction.ts";

function node(x1: number, y1: number, x2: number, y2: number): FocusNode {
    return {
        bounds: { x1, y1, x2, y2 },
        onFocus() {},
        onFocusLost() {},
        onFocusTapActivate() {
            return false;
        },
    };
}

describe("getClosestFocusableNode", () => {
    // Offset away from the origin so the centre and edge-distance math is
    // actually exercised rather than cancelling out against zero.
    const current: Bounds = { x1: 40, y1: 24, x2: 50, y2: 34 };

    it("returns null for an empty candidate list", () => {
        assert.strictEqual(
            getClosestFocusableNode([], current, Direction.Right),
            null,
        );
    });

    it("returns null when no node lies in the requested direction", () => {
        // Only candidate is to the left; we ask for right.
        const left = node(10, 24, 20, 34);
        assert.strictEqual(
            getClosestFocusableNode([left], current, Direction.Right),
            null,
        );
    });

    it("returns a node that is fully past the edge in the direction", () => {
        const right = node(80, 24, 90, 34);
        assert.strictEqual(
            getClosestFocusableNode([right], current, Direction.Right),
            right,
        );
    });

    it("picks the closest-by-edge candidate among several valid ones", () => {
        const near = node(60, 24, 70, 34);
        const far = node(140, 24, 150, 34);
        const result = getClosestFocusableNode(
            [far, near],
            current,
            Direction.Right,
        );
        assert.strictEqual(result, near);
    });
});
