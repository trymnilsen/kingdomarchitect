import { describe, it } from "node:test";
import assert from "node:assert";
import type { Point } from "../../../src/common/point.ts";
import { InteractionState } from "../../../src/game/interaction/handler/interactionState.ts";
import type { ComponentDescriptor } from "../../../src/ui/declarative/ui.ts";
import { uiButton } from "../../../src/ui/declarative/uiButton.ts";
import { colorBackground } from "../../../src/ui/uiBackground.ts";
import { createGestureHarness } from "./gestureHarness.ts";

const BUTTON_NORMAL = "test-button-normal";
const BUTTON_PRESSED = "test-button-pressed";

/**
 * A state exposing one declarative button, recording both button taps and the
 * fall-through taps that reach the state itself.
 */
class ButtonState extends InteractionState {
    buttonTaps = 0;
    stateTaps: Point[] = [];

    override getView(): ComponentDescriptor {
        return uiButton({
            width: 80,
            height: 40,
            background: colorBackground(BUTTON_NORMAL),
            pressedBackground: colorBackground(BUTTON_PRESSED),
            onTap: () => {
                this.buttonTaps += 1;
            },
        });
    }

    override onTap(screenPosition: Point, _worldPosition: Point): boolean {
        this.stateTaps.push(screenPosition);
        return false;
    }
}

/** A bare modal state: just the scrim, dismissed by tapping it. */
class TestModalState extends InteractionState {
    override get isModal(): boolean {
        return true;
    }
}

// Far from the HUD button and the status bar, over the bare world.
const WORLD_POINT = { x: 500, y: 400 };

function fills(rects: { fill: string }[]): string[] {
    return rects.map((rect) => rect.fill);
}

describe("InteractionHandler gestures", () => {
    it("a press that slides within the button still taps", () => {
        const harness = createGestureHarness();
        const state = new ButtonState();
        harness.pushState(state);

        const center = harness.centerOf(BUTTON_NORMAL);
        // 12px slide: well past the 5px drag threshold, still inside the
        // 80x40 button.
        harness.mouseGesture([
            center,
            { x: center.x + 6, y: center.y + 2 },
            { x: center.x + 12, y: center.y + 4 },
        ]);

        assert.strictEqual(state.buttonTaps, 1);
        assert.strictEqual(
            state.stateTaps.length,
            0,
            "the UI consumed the gesture, the state never saw it",
        );
    });

    it("the button stays visually pressed through an inside slide", () => {
        const harness = createGestureHarness();
        const state = new ButtonState();
        harness.pushState(state);

        const center = harness.centerOf(BUTTON_NORMAL);
        harness.canvas.fireMouse("mousedown", center);
        harness.canvas.fireMouse("mousemove", {
            x: center.x + 6,
            y: center.y + 2,
        });
        harness.canvas.fireMouse("mousemove", {
            x: center.x + 12,
            y: center.y + 4,
        });
        assert.ok(
            fills(harness.rects).includes(BUTTON_PRESSED),
            "pressed background while sliding inside",
        );

        harness.canvas.fireMouse("mouseup", {
            x: center.x + 12,
            y: center.y + 4,
        });
        assert.strictEqual(state.buttonTaps, 1, "release inside taps");
        assert.strictEqual(
            state.stateTaps.length,
            0,
            "the UI consumed the gesture, the state never saw it",
        );
        assert.ok(!fills(harness.rects).includes(BUTTON_PRESSED));
    });

    it("sliding off the button and releasing over the world does nothing", () => {
        const harness = createGestureHarness();
        const state = new ButtonState();
        harness.pushState(state);

        const center = harness.centerOf(BUTTON_NORMAL);
        harness.canvas.fireMouse("mousedown", center);
        harness.canvas.fireMouse("mousemove", { x: center.x + 60, y: 300 });
        harness.canvas.fireMouse("mousemove", WORLD_POINT);
        assert.ok(
            !fills(harness.rects).includes(BUTTON_PRESSED),
            "sliding off unpresses the button",
        );
        harness.canvas.fireMouse("mouseup", WORLD_POINT);

        assert.strictEqual(state.buttonTaps, 0, "no tap");
        assert.strictEqual(
            state.stateTaps.length,
            0,
            "the gesture is absorbed, it never falls through to the state",
        );
        assert.strictEqual(
            harness.currentState(),
            state,
            "no world selection happened",
        );
    });

    it("a drag starting on the world pans the camera and taps nothing on release over the button", () => {
        const harness = createGestureHarness();
        const state = new ButtonState();
        harness.pushState(state);

        const center = harness.centerOf(BUTTON_NORMAL);
        const cameraBefore = { ...harness.camera.position };
        // The first move past the threshold only arms dragging, pans flow
        // from the second move on.
        harness.mouseGesture([
            WORLD_POINT,
            { x: 450, y: 350 },
            { x: 400, y: 300 },
            center,
        ]);

        assert.notDeepStrictEqual(
            harness.camera.position,
            cameraBefore,
            "the drag panned the camera",
        );
        assert.strictEqual(
            state.buttonTaps,
            0,
            "a gesture that began on the world never taps a button",
        );
    });

    it("a tap on the scrim pops a modal state, a drag does not", () => {
        const harness = createGestureHarness();
        const state = new ButtonState();
        harness.pushState(state);
        const modal = new TestModalState();
        harness.pushState(modal);

        const cameraBefore = { ...harness.camera.position };
        harness.mouseGesture([
            WORLD_POINT,
            { x: 450, y: 350 },
            { x: 400, y: 300 },
            WORLD_POINT,
        ]);
        assert.strictEqual(
            harness.currentState(),
            modal,
            "a drag on the scrim does not dismiss the modal",
        );
        assert.deepStrictEqual(
            harness.camera.position,
            cameraBefore,
            "the camera does not pan while a modal is up",
        );

        harness.mouseGesture([WORLD_POINT]);
        assert.strictEqual(
            harness.currentState(),
            state,
            "a tap on the scrim pops the modal",
        );
    });

    it("a system-cancelled touch never taps and clears the pressed visual", () => {
        const harness = createGestureHarness();
        const state = new ButtonState();
        harness.pushState(state);

        const center = harness.centerOf(BUTTON_NORMAL);
        harness.touchCancelGesture(center);

        assert.strictEqual(state.buttonTaps, 0);
        assert.ok(
            !fills(harness.rects).includes(BUTTON_PRESSED),
            "the cancel released the press",
        );
    });
});
