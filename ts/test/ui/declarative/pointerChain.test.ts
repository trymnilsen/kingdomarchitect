import { describe, it } from "node:test";
import assert from "node:assert";
import { pointerChainAt } from "../../../src/ui/declarative/pointerChain.ts";
import type {
    Rectangle,
    UiNode,
} from "../../../src/ui/declarative/ui.ts";

/**
 * Builds a bare UiNode with an absolute layout region. Regions use non-trivial
 * coordinates so the containment math is actually exercised (a region anchored
 * at the origin would hide offset mistakes).
 */
function node(region: Rectangle, children: UiNode[] = []): UiNode {
    return {
        children,
        descriptor: {} as UiNode["descriptor"],
        layout: { offset: { x: 0, y: 0 }, region },
    };
}

describe("pointerChainAt", () => {
    it("includes both an interactive container and its interactive child", () => {
        const child = node({ x: 20, y: 14, width: 30, height: 20 });
        const container = node({ x: 12, y: 8, width: 60, height: 40 }, [child]);
        const interactive = new Set<UiNode>([container, child]);

        const chain = pointerChainAt(container, { x: 30, y: 20 }, (n) =>
            interactive.has(n),
        );

        assert.deepStrictEqual(chain, [container, child]);
    });

    it("picks the topmost (later-drawn) of two overlapping siblings", () => {
        const behind = node({ x: 12, y: 8, width: 30, height: 30 });
        const front = node({ x: 20, y: 8, width: 30, height: 30 });
        const root = node({ x: 0, y: 0, width: 80, height: 60 }, [
            behind,
            front,
        ]);
        const interactive = new Set<UiNode>([behind, front]);

        // x:25 lies inside both siblings' overlap; the later child wins.
        const chain = pointerChainAt(root, { x: 25, y: 20 }, (n) =>
            interactive.has(n),
        );

        assert.deepStrictEqual(chain, [front]);
    });

    it("skips a non-interactive node between an interactive ancestor and the point", () => {
        const label = node({ x: 16, y: 12, width: 20, height: 10 });
        const button = node({ x: 12, y: 8, width: 40, height: 30 }, [label]);
        const interactive = new Set<UiNode>([button]); // label is not interactive

        const chain = pointerChainAt(button, { x: 20, y: 15 }, (n) =>
            interactive.has(n),
        );

        assert.deepStrictEqual(chain, [button]);
    });

    it("returns an empty chain when the point is outside every region", () => {
        const button = node({ x: 12, y: 8, width: 40, height: 30 });
        const interactive = new Set<UiNode>([button]);

        const chain = pointerChainAt(button, { x: 500, y: 500 }, (n) =>
            interactive.has(n),
        );

        assert.deepStrictEqual(chain, []);
    });

    it("orders the chain outermost to deepest when several nest", () => {
        const leaf = node({ x: 20, y: 16, width: 30, height: 20 });
        const mid = node({ x: 16, y: 12, width: 60, height: 40 }, [leaf]);
        const outer = node({ x: 12, y: 8, width: 80, height: 60 }, [mid]);
        const interactive = new Set<UiNode>([outer, mid, leaf]);

        const chain = pointerChainAt(outer, { x: 30, y: 24 }, (n) =>
            interactive.has(n),
        );

        assert.deepStrictEqual(chain, [outer, mid, leaf]);
    });
});
