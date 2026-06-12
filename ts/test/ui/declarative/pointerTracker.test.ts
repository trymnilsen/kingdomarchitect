import { describe, it } from "node:test";
import assert from "node:assert";
import { PointerTracker } from "../../../src/ui/declarative/pointerTracker.ts";
import type { UiNode } from "../../../src/ui/declarative/ui.ts";

// The tracker only uses node identity, so bare objects suffice as stand-ins.
function fakeNode(): UiNode {
    return {} as UiNode;
}

describe("PointerTracker", () => {
    it("reports every node of a captured chain as pressed and captured", () => {
        const tracker = new PointerTracker();
        const container = fakeNode();
        const child = fakeNode();
        const other = fakeNode();

        tracker.beginCapture([container, child]);

        assert.strictEqual(tracker.hasCapture(), true);
        assert.strictEqual(tracker.flagsFor(container).pressed, true);
        assert.strictEqual(tracker.flagsFor(child).pressed, true);
        assert.strictEqual(tracker.flagsFor(other).pressed, false);
        assert.strictEqual(tracker.isCaptured(container), true);
        assert.strictEqual(tracker.isCaptured(child), true);
        assert.strictEqual(tracker.isCaptured(other), false);
    });

    it("replaces the previous gesture on beginCapture", () => {
        const tracker = new PointerTracker();
        const first = fakeNode();
        const second = fakeNode();

        tracker.beginCapture([first]);
        tracker.beginCapture([second]);

        assert.strictEqual(tracker.isPressed(first), false);
        assert.strictEqual(tracker.isCaptured(first), false);
        assert.strictEqual(tracker.isPressed(second), true);
        assert.strictEqual(tracker.isCaptured(second), true);
    });

    it("beginCapture with an empty chain leaves no capture", () => {
        const tracker = new PointerTracker();

        tracker.beginCapture([]);

        assert.strictEqual(tracker.hasCapture(), false);
    });

    it("moveCapture unpresses a node the pointer left but keeps it captured", () => {
        const tracker = new PointerTracker();
        const container = fakeNode();
        const child = fakeNode();

        tracker.beginCapture([container, child]);
        tracker.moveCapture([container]);

        assert.strictEqual(tracker.isPressed(child), false);
        assert.strictEqual(tracker.isCaptured(child), true);
        assert.strictEqual(tracker.isPressed(container), true);
    });

    it("moveCapture re-presses a node the pointer returns to", () => {
        const tracker = new PointerTracker();
        const node = fakeNode();

        tracker.beginCapture([node]);
        tracker.moveCapture([]);
        assert.strictEqual(tracker.isPressed(node), false);

        tracker.moveCapture([node]);
        assert.strictEqual(tracker.isPressed(node), true);
    });

    it("moveCapture never presses a node outside the captured chain", () => {
        const tracker = new PointerTracker();
        const captured = fakeNode();
        const other = fakeNode();

        tracker.beginCapture([captured]);
        tracker.moveCapture([other]);

        assert.strictEqual(tracker.isPressed(other), false);
        assert.strictEqual(tracker.isCaptured(other), false);
    });

    it("moveCapture without a capture does nothing", () => {
        const tracker = new PointerTracker();
        const node = fakeNode();

        tracker.moveCapture([node]);

        assert.strictEqual(tracker.isPressed(node), false);
        assert.strictEqual(tracker.hasCapture(), false);
    });

    it("endCapture clears the gesture", () => {
        const tracker = new PointerTracker();
        const node = fakeNode();

        tracker.beginCapture([node]);
        tracker.endCapture();

        assert.strictEqual(tracker.hasCapture(), false);
        assert.strictEqual(tracker.isPressed(node), false);
        assert.strictEqual(tracker.isCaptured(node), false);
    });

    it("forget removes a node everywhere but keeps the capture active", () => {
        const tracker = new PointerTracker();
        const a = fakeNode();
        const b = fakeNode();

        tracker.beginCapture([a, b]);
        tracker.setHovered([a]);
        tracker.forget(a);

        const flagsA = tracker.flagsFor(a);
        assert.strictEqual(flagsA.pressed, false);
        assert.strictEqual(flagsA.hovered, false);
        assert.strictEqual(tracker.isCaptured(a), false);
        assert.strictEqual(tracker.flagsFor(b).pressed, true);
        assert.strictEqual(
            tracker.hasCapture(),
            true,
            "a gesture survives its nodes unmounting so the release is still absorbed",
        );
    });

    it("tracks pressed and hovered independently", () => {
        const tracker = new PointerTracker();
        const pressedNode = fakeNode();
        const hoveredNode = fakeNode();

        tracker.beginCapture([pressedNode]);
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
