import { describe, it } from "node:test";
import assert from "node:assert";
import { PointerTracker } from "../../../src/ui/declarative/pointerTracker.ts";
import type { UiNode } from "../../../src/ui/declarative/ui.ts";

// The tracker only uses node identity, so bare objects suffice as stand-ins.
function fakeNode(): UiNode {
    return {} as UiNode;
}

describe("PointerTracker", () => {
    it("reports every node of a pressed chain as pressed", () => {
        const tracker = new PointerTracker();
        const container = fakeNode();
        const child = fakeNode();
        const other = fakeNode();

        tracker.setPressed([container, child]);

        assert.strictEqual(tracker.flagsFor(container).pressed, true);
        assert.strictEqual(tracker.flagsFor(child).pressed, true);
        assert.strictEqual(tracker.flagsFor(other).pressed, false);
    });

    it("replaces the previous chain on setPressed", () => {
        const tracker = new PointerTracker();
        const first = fakeNode();
        const second = fakeNode();

        tracker.setPressed([first]);
        tracker.setPressed([second]);

        assert.strictEqual(tracker.isPressed(first), false);
        assert.strictEqual(tracker.isPressed(second), true);
    });

    it("forget removes a node from both pressed and hovered", () => {
        const tracker = new PointerTracker();
        const a = fakeNode();
        const b = fakeNode();

        tracker.setPressed([a, b]);
        tracker.setHovered([a]);
        tracker.forget(a);

        const flagsA = tracker.flagsFor(a);
        assert.strictEqual(flagsA.pressed, false);
        assert.strictEqual(flagsA.hovered, false);
        assert.strictEqual(tracker.flagsFor(b).pressed, true);
    });

    it("tracks pressed and hovered independently", () => {
        const tracker = new PointerTracker();
        const pressedNode = fakeNode();
        const hoveredNode = fakeNode();

        tracker.setPressed([pressedNode]);
        tracker.setHovered([hoveredNode]);

        assert.deepStrictEqual(tracker.flagsFor(pressedNode), {
            pressed: true,
            hovered: false,
        });
        assert.deepStrictEqual(tracker.flagsFor(hoveredNode), {
            pressed: false,
            hovered: true,
        });

        tracker.clearHovered();
        assert.strictEqual(tracker.flagsFor(hoveredNode).hovered, false);
        assert.strictEqual(tracker.flagsFor(pressedNode).pressed, true);
    });
});
