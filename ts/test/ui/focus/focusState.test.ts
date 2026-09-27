import { describe, it } from "node:test";
import assert from "node:assert";
import { FocusState } from "../../../src/ui/focus/focusState.ts";
import type { FocusNode } from "../../../src/ui/focus/focusNode.ts";
import type { Bounds } from "../../../src/common/bounds.ts";

type SpyNode = FocusNode & {
    focusedCount: number;
    focusLostCount: number;
};

function makeNode(bounds: Bounds): SpyNode {
    const node: SpyNode = {
        bounds,
        focusedCount: 0,
        focusLostCount: 0,
        onFocus() {
            node.focusedCount++;
        },
        onFocusLost() {
            node.focusLostCount++;
        },
        onFocusTapActivate() {
            return false;
        },
    };
    return node;
}

function boundsAt(x: number, y: number): Bounds {
    return { x1: x, y1: y, x2: x + 10, y2: y + 10 };
}

describe("FocusState", () => {
    it("setFocus moves focus, losing the previous node before focusing the new one", () => {
        const a = makeNode(boundsAt(0, 0));
        const b = makeNode(boundsAt(50, 50));
        const state = new FocusState();

        state.setFocus(a);
        assert.strictEqual(a.focusedCount, 1);
        assert.strictEqual(a.focusLostCount, 0);

        state.setFocus(b);
        assert.strictEqual(a.focusLostCount, 1);
        assert.strictEqual(b.focusedCount, 1);
        assert.strictEqual(state.currentFocus, b);
    });
});
