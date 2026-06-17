import { describe, it } from "node:test";
import assert from "node:assert";
import {
    getClosestFocusableNode,
    getFocusableNodes,
    type FocusNode,
} from "../../../src/ui/focus/focusHelpers.ts";
import type { Bounds } from "../../../src/common/bounds.ts";
import { Direction } from "../../../src/common/direction.ts";
import type { UIView } from "../../../src/ui/uiView.ts";

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

// Minimal duck-typed UIView tree: getFocusableNodes only reads `.children`
// (via visitChildren) and `.focusNodes`.
function fakeView(
    focusNodes: FocusNode[] | null,
    children: unknown[] = [],
): UIView {
    return { focusNodes, children } as unknown as UIView;
}

describe("getFocusableNodes", () => {
    it("collects focus nodes from the view and its descendants", () => {
        const a = node(0, 0, 10, 10);
        const b = node(20, 0, 30, 10);
        const root = fakeView(null, [
            fakeView([a]),
            fakeView(null, [fakeView([b])]),
        ]);

        const result = getFocusableNodes(root);
        assert.strictEqual(result.length, 2);
        assert.ok(result.includes(a));
        assert.ok(result.includes(b));
    });

    it("returns an empty array when no view exposes focus nodes", () => {
        const root = fakeView(null, [fakeView(null), fakeView([])]);
        assert.deepStrictEqual(getFocusableNodes(root), []);
    });
});

describe("getClosestFocusableNode", () => {
    const current: Bounds = { x1: 0, y1: 0, x2: 10, y2: 10 };

    it("returns null for an empty candidate list", () => {
        assert.strictEqual(
            getClosestFocusableNode([], current, Direction.Right),
            null,
        );
    });

    it("returns null when no node lies in the requested direction", () => {
        // Only candidate is to the left; we ask for right.
        const left = node(-30, 0, -20, 10);
        assert.strictEqual(
            getClosestFocusableNode([left], current, Direction.Right),
            null,
        );
    });

    it("returns a node that is fully past the edge in the direction", () => {
        const right = node(40, 0, 50, 10);
        assert.strictEqual(
            getClosestFocusableNode([right], current, Direction.Right),
            right,
        );
    });

    it("picks the closest-by-edge candidate among several valid ones", () => {
        const near = node(20, 0, 30, 10);
        const far = node(100, 0, 110, 10);
        const result = getClosestFocusableNode(
            [far, near],
            current,
            Direction.Right,
        );
        assert.strictEqual(result, near);
    });
});
