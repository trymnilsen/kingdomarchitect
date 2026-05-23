import { describe, it } from "node:test";
import assert from "node:assert";
import { colorBackground } from "../../../src/ui/uiBackground.ts";
import {
    createComponent,
    type PlacedChild,
} from "../../../src/ui/declarative/ui.ts";
import { uiButton } from "../../../src/ui/declarative/uiButton.ts";
import { createPointerHarness } from "./pointerTestHarness.ts";

// Places already-built children at explicit, non-origin offsets so each
// button's hit region is known and deterministic (and never anchored at 0,0,
// which would mask offset bugs).
const placedRoot = createComponent<{ children: PlacedChild[] }>(({ props }) => ({
    size: { width: 200, height: 120 },
    children: props.children,
}));

const A_REGION = { x: 12, y: 10, width: 40, height: 30 };
const B_REGION = { x: 80, y: 10, width: 40, height: 30 };
const A_CENTER = { x: 32, y: 25 };
const B_CENTER = { x: 100, y: 25 };

function place(
    descriptor: ReturnType<typeof uiButton>,
    region: { x: number; y: number; width: number; height: number },
): PlacedChild {
    return {
        ...descriptor,
        offset: { x: region.x, y: region.y },
        size: { width: region.width, height: region.height },
    };
}

function fills(rects: { fill: string }[]): string[] {
    return rects.map((rect) => rect.fill);
}

describe("pointer interaction (Scenario)", () => {
    it("shows the pressed background while pressed, then reverts and taps on release", () => {
        const harness = createPointerHarness();
        let taps = 0;
        const button = place(
            uiButton({
                width: A_REGION.width,
                height: A_REGION.height,
                background: colorBackground("normal"),
                pressedBackground: colorBackground("pressed"),
                onTap: () => {
                    taps += 1;
                },
            }),
            A_REGION,
        );
        const ui = () => placedRoot({ children: [button] });

        harness.render(ui());
        assert.deepStrictEqual(fills(harness.rects), ["normal"]);

        const captured = harness.pointerDown(A_CENTER);
        assert.strictEqual(captured, true, "press lands on the button");
        harness.render(ui());
        assert.deepStrictEqual(fills(harness.rects), ["pressed"]);

        const tapped = harness.pointerUp(A_CENTER);
        harness.render(ui());
        assert.strictEqual(tapped, true, "release on the button fires a tap");
        assert.strictEqual(taps, 1);
        assert.deepStrictEqual(fills(harness.rects), ["normal"]);
    });

    it("does not stay stuck pressed when the gesture becomes a drag", () => {
        const harness = createPointerHarness();
        let taps = 0;
        const button = place(
            uiButton({
                width: A_REGION.width,
                height: A_REGION.height,
                background: colorBackground("normal"),
                pressedBackground: colorBackground("pressed"),
                onTap: () => {
                    taps += 1;
                },
            }),
            A_REGION,
        );
        const ui = () => placedRoot({ children: [button] });

        harness.render(ui());
        harness.pointerDown(A_CENTER);
        harness.render(ui());
        assert.deepStrictEqual(fills(harness.rects), ["pressed"]);

        harness.pointerCancel();
        harness.render(ui());
        assert.deepStrictEqual(
            fills(harness.rects),
            ["normal"],
            "press is released by the cancel",
        );
        assert.strictEqual(taps, 0, "a cancelled press does not tap");
    });

    it("pressing one button does not press its sibling", () => {
        const harness = createPointerHarness();
        const buttonA = place(
            uiButton({
                width: A_REGION.width,
                height: A_REGION.height,
                background: colorBackground("a-normal"),
                pressedBackground: colorBackground("a-pressed"),
                onTap: () => {},
            }),
            A_REGION,
        );
        const buttonB = place(
            uiButton({
                width: B_REGION.width,
                height: B_REGION.height,
                background: colorBackground("b-normal"),
                pressedBackground: colorBackground("b-pressed"),
                onTap: () => {},
            }),
            B_REGION,
        );
        const ui = () => placedRoot({ children: [buttonA, buttonB] });

        harness.render(ui());
        harness.pointerDown(A_CENTER);
        harness.render(ui());

        const drawn = fills(harness.rects);
        assert.ok(drawn.includes("a-pressed"), "pressed button shows pressed bg");
        assert.ok(drawn.includes("b-normal"), "sibling stays normal");
        assert.ok(!drawn.includes("a-normal"));
        assert.ok(!drawn.includes("b-pressed"));
    });

    it("does not tap when released outside the pressed button", () => {
        const harness = createPointerHarness();
        let taps = 0;
        const button = place(
            uiButton({
                width: A_REGION.width,
                height: A_REGION.height,
                background: colorBackground("normal"),
                pressedBackground: colorBackground("pressed"),
                onTap: () => {
                    taps += 1;
                },
            }),
            A_REGION,
        );
        const ui = () => placedRoot({ children: [button] });

        harness.render(ui());
        harness.pointerDown(A_CENTER);
        const tapped = harness.pointerUp(B_CENTER);
        harness.render(ui());

        assert.strictEqual(tapped, false, "release outside fires no tap");
        assert.strictEqual(taps, 0);
        assert.deepStrictEqual(fills(harness.rects), ["normal"]);
    });
});
