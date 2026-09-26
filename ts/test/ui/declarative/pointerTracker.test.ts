import { describe, it } from "node:test";
import assert from "node:assert";
import { PointerTracker } from "../../../src/ui/declarative/pointerTracker.ts";
import type { UiNode } from "../../../src/ui/declarative/ui.ts";

// The tracker only uses node identity, so bare objects suffice as stand-ins.
function fakeNode(): UiNode {
    return {} as UiNode;
}

describe("PointerTracker", () => {
    it("moveCapture unpresses a node the pointer left but keeps it captured", () => {
        const tracker = new PointerTracker();
        const container = fakeNode();
        const child = fakeNode();

        tracker.beginCapture([container, child]);
        tracker.moveCapture([container]);

        assert.strictEqual(tracker.flagsFor(child).pressed, false);
        assert.strictEqual(tracker.isCaptured(child), true);
        assert.strictEqual(tracker.flagsFor(container).pressed, true);
    });

    it("forget removes a node everywhere but keeps the capture active", () => {
        const tracker = new PointerTracker();
        const a = fakeNode();
        const b = fakeNode();

        tracker.beginCapture([a, b]);
        tracker.forget(a);

        assert.strictEqual(tracker.flagsFor(a).pressed, false);
        assert.strictEqual(tracker.isCaptured(a), false);
        assert.strictEqual(tracker.flagsFor(b).pressed, true);
        assert.strictEqual(
            tracker.hasCapture(),
            true,
            "a gesture survives its nodes unmounting so the release is still absorbed",
        );
    });
});
