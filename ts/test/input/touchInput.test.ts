import { describe, it } from "node:test";
import assert from "node:assert";
import { TouchInput } from "../../src/input/touchInput.ts";
import type { OnTapEndEvent } from "../../src/input/touchInput.ts";
import type { Point } from "../../src/common/point.ts";
import { createFakeCanvas } from "./fakeCanvas.ts";
import type { FakeCanvas } from "./fakeCanvas.ts";

type Recorded = {
    canvas: FakeCanvas;
    downs: Point[];
    pans: { movement: Point; position: Point; downTapHandled: boolean }[];
    ends: OnTapEndEvent[];
    cancels: number;
};

function createRecordedInput(downReturns: boolean = true): Recorded {
    const canvas = createFakeCanvas();
    const input = new TouchInput(canvas.element);
    const recorded: Recorded = {
        canvas,
        downs: [],
        pans: [],
        ends: [],
        cancels: 0,
    };
    input.onTapDown = (position) => {
        recorded.downs.push(position);
        return downReturns;
    };
    input.onPan = (movement, position, _startPosition, downTapHandled) => {
        recorded.pans.push({ movement, position, downTapHandled });
    };
    input.onTapEnd = (event) => {
        recorded.ends.push(event);
    };
    input.onTapCancel = () => {
        recorded.cancels += 1;
    };
    return recorded;
}

describe("TouchInput", () => {
    it("a down and up without movement ends as a non-dragging tap", () => {
        const recorded = createRecordedInput();

        recorded.canvas.fireMouse("mousedown", { x: 10, y: 10 });
        recorded.canvas.fireMouse("mouseup", { x: 10, y: 10 });

        assert.deepStrictEqual(recorded.downs, [{ x: 10, y: 10 }]);
        assert.strictEqual(recorded.pans.length, 0);
        assert.strictEqual(recorded.ends.length, 1);
        assert.strictEqual(recorded.ends[0].wasDragging, false);
        assert.deepStrictEqual(recorded.ends[0].position, { x: 10, y: 10 });
    });

    it("movement within the drag threshold stays a tap and emits no pans", () => {
        const recorded = createRecordedInput();

        recorded.canvas.fireMouse("mousedown", { x: 10, y: 10 });
        recorded.canvas.fireMouse("mousemove", { x: 13, y: 13 });
        recorded.canvas.fireMouse("mouseup", { x: 13, y: 13 });

        assert.strictEqual(recorded.pans.length, 0);
        assert.strictEqual(recorded.ends[0].wasDragging, false);
        assert.deepStrictEqual(
            recorded.ends[0].position,
            { x: 13, y: 13 },
            "the up reports the release point, not the down point",
        );
    });

    it("movement past the drag threshold emits pans and ends as dragging", () => {
        const recorded = createRecordedInput(true);

        recorded.canvas.fireMouse("mousedown", { x: 10, y: 10 });
        // First move past the threshold arms dragging, pans flow from the next.
        recorded.canvas.fireMouse("mousemove", { x: 20, y: 10 });
        recorded.canvas.fireMouse("mousemove", { x: 25, y: 10 });
        recorded.canvas.fireMouse("mouseup", { x: 25, y: 10 });

        assert.ok(recorded.pans.length > 0, "pan events flow while dragging");
        assert.strictEqual(
            recorded.pans[0].downTapHandled,
            true,
            "pans carry whether the down was handled",
        );
        assert.strictEqual(recorded.ends[0].wasDragging, true);
        assert.deepStrictEqual(recorded.ends[0].startPosition, {
            x: 10,
            y: 10,
        });
    });

    it("pans report an unhandled down so the camera can take the drag", () => {
        const recorded = createRecordedInput(false);

        recorded.canvas.fireMouse("mousedown", { x: 10, y: 10 });
        recorded.canvas.fireMouse("mousemove", { x: 20, y: 10 });
        recorded.canvas.fireMouse("mousemove", { x: 25, y: 10 });

        assert.strictEqual(recorded.pans[0].downTapHandled, false);
    });

    it("touchend reports the last move position as the release point", () => {
        const recorded = createRecordedInput();

        recorded.canvas.fireTouch("touchstart", { x: 10, y: 10 });
        recorded.canvas.fireTouch("touchmove", { x: 20, y: 10 });
        recorded.canvas.fireTouch("touchmove", { x: 30, y: 12 });
        recorded.canvas.fireTouch("touchend");

        assert.strictEqual(recorded.ends.length, 1);
        assert.deepStrictEqual(recorded.ends[0].position, { x: 30, y: 12 });
    });

    it("touchcancel fires onTapCancel and never onTapEnd", () => {
        const recorded = createRecordedInput();

        recorded.canvas.fireTouch("touchstart", { x: 10, y: 10 });
        recorded.canvas.fireTouch("touchcancel");

        assert.strictEqual(recorded.cancels, 1);
        assert.strictEqual(
            recorded.ends.length,
            0,
            "a system-cancelled touch must not count as an up",
        );

        // The gesture is fully reset: a fresh tap works afterwards.
        recorded.canvas.fireTouch("touchstart", { x: 10, y: 10 });
        recorded.canvas.fireTouch("touchend");
        assert.strictEqual(recorded.ends.length, 1);
        assert.strictEqual(recorded.ends[0].wasDragging, false);
    });

    it("duplicate end events only end the tap once", () => {
        const recorded = createRecordedInput();

        recorded.canvas.fireMouse("mousedown", { x: 10, y: 10 });
        recorded.canvas.fireMouse("mouseup", { x: 10, y: 10 });
        recorded.canvas.fireMouse("mouseleave", { x: 10, y: 10 });

        assert.strictEqual(recorded.ends.length, 1);
    });
});
