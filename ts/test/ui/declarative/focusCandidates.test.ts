import { describe, it } from "node:test";
import assert from "node:assert";
import { focusCandidates } from "../../../src/ui/declarative/interactiveNodes.ts";
import type { UiNode } from "../../../src/ui/declarative/ui.ts";
import type { Rectangle } from "../../../src/common/structure/rectangle.ts";

function node(
    region: Rectangle,
    children: UiNode[] = [],
    clip: boolean = false,
): UiNode {
    return {
        children,
        descriptor: {} as UiNode["descriptor"],
        layout: { offset: { x: 0, y: 0 }, region, clip },
    };
}

const viewport: Rectangle = { x: 0, y: 0, width: 200, height: 100 };

describe("focusCandidates", () => {
    it("leaves out nodes outside a clip or the viewport and crops partly visible ones", () => {
        const hidden = node({ x: 12, y: 70, width: 20, height: 20 });
        const partial = node({ x: 40, y: 30, width: 20, height: 20 });
        const offscreen = node({ x: 240, y: 10, width: 20, height: 20 });
        const clip = node(
            { x: 10, y: 10, width: 100, height: 30 },
            [hidden, partial],
            true,
        );
        const focusable = new Set([hidden, partial, offscreen]);

        const candidates = focusCandidates(
            node(viewport, [clip, offscreen]),
            viewport,
            (n) => focusable.has(n),
        );

        assert.deepStrictEqual(
            candidates.map((c) => c.node),
            [partial],
        );
        assert.deepStrictEqual(candidates[0].bounds, {
            x1: 40,
            y1: 30,
            x2: 60,
            y2: 40,
        });
    });


    it("records focusable ancestors so navigation can skip relatives", () => {
        const button = node({ x: 20, y: 20, width: 10, height: 10 });
        const layout = node({ x: 15, y: 15, width: 40, height: 40 }, [button]);
        const card = node({ x: 10, y: 10, width: 60, height: 60 }, [layout]);
        const focusable = new Set([card, button]);

        const candidates = focusCandidates(
            node(viewport, [card]),
            viewport,
            (n) => focusable.has(n),
        );

        const buttonCandidate = candidates.find((c) => c.node === button);
        assert.deepStrictEqual(
            buttonCandidate?.ancestors,
            [card],
            "the plain layout node in between is not an ancestor that counts",
        );
    });
});
