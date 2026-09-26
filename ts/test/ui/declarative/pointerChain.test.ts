import { describe, it } from "node:test";
import assert from "node:assert";
import { pointerChainAt } from "../../../src/ui/declarative/pointerChain.ts";
import type { UiNode } from "../../../src/ui/declarative/ui.ts";
import type { Rectangle } from "../../../src/common/structure/rectangle.ts";

/**
 * Builds a bare UiNode with an absolute layout region. The regions use
 * non-trivial coordinates so the containment math actually runs. A region at
 * the origin would hide offset mistakes.
 */
function node(region: Rectangle, children: UiNode[] = []): UiNode {
    return {
        children,
        descriptor: {} as UiNode["descriptor"],
        layout: { offset: { x: 0, y: 0 }, region },
    };
}

describe("pointerChainAt", () => {
    it("picks the topmost (later-drawn) of two overlapping siblings", () => {
        const behind = node({ x: 12, y: 8, width: 30, height: 30 });
        const front = node({ x: 20, y: 8, width: 30, height: 30 });
        const root = node({ x: 0, y: 0, width: 80, height: 60 }, [
            behind,
            front,
        ]);
        const interactive = new Set<UiNode>([behind, front]);

        // x:25 lies inside both siblings. The later child wins.
        const chain = pointerChainAt(root, { x: 25, y: 20 }, (n) =>
            interactive.has(n),
        );

        assert.deepStrictEqual(chain, [front]);
    });
});
