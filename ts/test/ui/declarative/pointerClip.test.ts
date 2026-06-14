import { describe, it } from "node:test";
import assert from "node:assert";
import { colorBackground } from "../../../src/ui/uiBackground.ts";
import {
    createComponent,
    type PlacedChild,
} from "../../../src/ui/declarative/ui.ts";
import { uiButton } from "../../../src/ui/declarative/uiButton.ts";
import { createPointerHarness } from "./pointerTestHarness.ts";

// A clipping viewport 200x40 tall. Its single child button is taller than the
// viewport, so the button's lower half is cropped away by the clip.
const clipRoot = createComponent<{ child: PlacedChild }>(({ props }) => ({
    size: { width: 200, height: 40 },
    clip: true,
    children: [props.child],
}));

const BUTTON_REGION = { x: 12, y: 10, width: 40, height: 60 };
const VISIBLE_POINT = { x: 32, y: 25 }; // inside viewport (y < 40): visible
const CROPPED_POINT = { x: 32, y: 55 }; // inside button but below the clip

describe("clipped subtree hit-testing (Scenario)", () => {
    function build(onTap: () => void) {
        const harness = createPointerHarness();
        const button: PlacedChild = {
            ...uiButton({
                width: BUTTON_REGION.width,
                height: BUTTON_REGION.height,
                background: colorBackground("normal"),
                onTap,
            }),
            offset: { x: BUTTON_REGION.x, y: BUTTON_REGION.y },
            size: { width: BUTTON_REGION.width, height: BUTTON_REGION.height },
        };
        return { harness, ui: () => clipRoot({ child: button }) };
    }

    it("fires a tap on the visible part of a clipped child", () => {
        let taps = 0;
        const { harness, ui } = build(() => {
            taps += 1;
        });

        harness.render(ui());
        const captured = harness.pointerDown(VISIBLE_POINT);
        assert.strictEqual(captured, true, "press lands on the visible button");
        harness.pointerUp(VISIBLE_POINT);
        assert.strictEqual(taps, 1);
    });

    it("ignores a tap in the area cropped away by the clip", () => {
        let taps = 0;
        const { harness, ui } = build(() => {
            taps += 1;
        });

        harness.render(ui());
        const captured = harness.pointerDown(CROPPED_POINT);
        assert.strictEqual(
            captured,
            false,
            "press in the cropped area hits nothing",
        );
        harness.pointerUp(CROPPED_POINT);
        assert.strictEqual(taps, 0);
    });
});
