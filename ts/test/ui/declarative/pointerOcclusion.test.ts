import { describe, it } from "node:test";
import assert from "node:assert";
import { colorBackground } from "../../../src/ui/uiBackground.ts";
import {
    createComponent,
    type ComponentDescriptor,
    type PlacedChild,
} from "../../../src/ui/declarative/ui.ts";
import { uiBox } from "../../../src/ui/declarative/uiBox.ts";
import { uiButton } from "../../../src/ui/declarative/uiButton.ts";
import { createPointerHarness } from "./pointerTestHarness.ts";

// A root that places already-built children at explicit offsets so each hit
// region is known. Offsets stay off 0,0 so an offset bug can't hide.
const placedRoot = createComponent<{ children: PlacedChild[] }>(
    ({ props }) => ({
        size: { width: 200, height: 120 },
        children: props.children,
    }),
);

const PANEL_REGION = { x: 12, y: 10, width: 60, height: 40 };
const PANEL_CENTER = { x: 42, y: 30 };
const OUTSIDE_POINT = { x: 150, y: 90 };

function place(
    descriptor: ComponentDescriptor,
    region: { x: number; y: number; width: number; height: number },
): PlacedChild {
    return {
        ...descriptor,
        offset: { x: region.x, y: region.y },
        size: { width: region.width, height: region.height },
    };
}

describe("pointer occlusion (Scenario)", () => {
    it("absorbs a tap that lands on a backgrounded box even with no handler", () => {
        const harness = createPointerHarness();
        const panel = place(
            uiBox({
                width: PANEL_REGION.width,
                height: PANEL_REGION.height,
                background: colorBackground("panel"),
            }),
            PANEL_REGION,
        );
        harness.render(placedRoot({ children: [panel] }));

        const captured = harness.pointerDown(PANEL_CENTER);
        assert.strictEqual(
            captured,
            true,
            "a backgrounded box is a solid surface that captures the press",
        );

        const handled = harness.pointerUp(PANEL_CENTER);
        assert.strictEqual(
            handled,
            true,
            "the tap is absorbed so it cannot fall through to a dismiss scrim",
        );
    });

    it("lets a tap fall through where there is no backgrounded surface", () => {
        const harness = createPointerHarness();
        const panel = place(
            uiBox({
                width: PANEL_REGION.width,
                height: PANEL_REGION.height,
                background: colorBackground("panel"),
            }),
            PANEL_REGION,
        );
        harness.render(placedRoot({ children: [panel] }));

        assert.strictEqual(
            harness.pointerDown(OUTSIDE_POINT),
            false,
            "press on empty space is not captured",
        );
        assert.strictEqual(
            harness.pointerUp(OUTSIDE_POINT),
            false,
            "release on empty space is not handled, so a modal can dismiss",
        );
    });

    it("does not occlude a box that paints no background", () => {
        const harness = createPointerHarness();
        const plain = place(
            uiBox({
                width: PANEL_REGION.width,
                height: PANEL_REGION.height,
            }),
            PANEL_REGION,
        );
        harness.render(placedRoot({ children: [plain] }));

        assert.strictEqual(
            harness.pointerDown(PANEL_CENTER),
            false,
            "a plain layout box stays transparent to pointers",
        );
        assert.strictEqual(harness.pointerUp(PANEL_CENTER), false);
    });

    it("a backgrounded box inside a button does not steal the button's tap", () => {
        const harness = createPointerHarness();
        let taps = 0;
        // Mirrors uiMenuButton: an interactive button whose child paints a
        // background. The decorative child must not swallow the button's tap.
        const button = place(
            uiButton({
                width: PANEL_REGION.width,
                height: PANEL_REGION.height,
                onTap: () => {
                    taps += 1;
                },
                child: uiBox({
                    width: PANEL_REGION.width,
                    height: PANEL_REGION.height,
                    background: colorBackground("decoration"),
                }),
            }),
            PANEL_REGION,
        );
        harness.render(placedRoot({ children: [button] }));

        harness.pointerDown(PANEL_CENTER);
        const handled = harness.pointerUp(PANEL_CENTER);

        assert.strictEqual(handled, true, "the tap is handled");
        assert.strictEqual(
            taps,
            1,
            "the button's handler runs, not the decorative child",
        );
    });
});
