import { describe, it } from "node:test";
import assert from "node:assert";
import { colorBackground } from "../../../src/ui/uiBackground.ts";
import {
    createComponent,
    type PlacedChild,
} from "../../../src/ui/declarative/ui.ts";
import { uiButton } from "../../../src/ui/declarative/uiButton.ts";
import { createPointerHarness } from "./pointerTestHarness.ts";

// Places already-built children at explicit offsets so each button's hit
// region is known. The offsets stay off 0,0 so an offset bug can't hide.
const placedRoot = createComponent<{ children: PlacedChild[] }>(
    ({ props }) => ({
        size: { width: 200, height: 120 },
        children: props.children,
    }),
);

const A_REGION = { x: 12, y: 10, width: 40, height: 30 };
const B_REGION = { x: 80, y: 10, width: 40, height: 30 };
const A_CENTER = { x: 32, y: 25 };
const A_EDGE = { x: 45, y: 15 };
const B_CENTER = { x: 100, y: 25 };
const OUTSIDE = { x: 180, y: 100 };

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

    it("a slide that stays inside the button keeps it pressed and taps", () => {
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
        harness.pointerMove(A_EDGE);
        harness.render(ui());
        assert.deepStrictEqual(
            fills(harness.rects),
            ["pressed"],
            "stays pressed while the slide remains inside",
        );

        const handled = harness.pointerUp(A_EDGE);
        assert.strictEqual(handled, true);
        assert.strictEqual(taps, 1, "release inside the button taps");
    });

    it("unpresses when the slide leaves the button, re-presses and taps on return", () => {
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
        harness.pointerMove(OUTSIDE);
        harness.render(ui());
        assert.deepStrictEqual(
            fills(harness.rects),
            ["normal"],
            "sliding off the button unpresses it",
        );

        harness.pointerMove(A_CENTER);
        harness.render(ui());
        assert.deepStrictEqual(
            fills(harness.rects),
            ["pressed"],
            "sliding back re-presses it",
        );

        const handled = harness.pointerUp(A_CENTER);
        assert.strictEqual(handled, true);
        assert.strictEqual(taps, 1, "the press re-armed, release taps");
    });

    it("a press cancelled by the system does not tap", () => {
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
        assert.ok(
            drawn.includes("a-pressed"),
            "pressed button shows pressed bg",
        );
        assert.ok(drawn.includes("b-normal"), "sibling stays normal");
        assert.ok(!drawn.includes("a-normal"));
        assert.ok(!drawn.includes("b-pressed"));
    });

    it("sliding onto a sibling button neither presses nor taps it", () => {
        const harness = createPointerHarness();
        let tapsA = 0;
        let tapsB = 0;
        const buttonA = place(
            uiButton({
                width: A_REGION.width,
                height: A_REGION.height,
                background: colorBackground("a-normal"),
                pressedBackground: colorBackground("a-pressed"),
                onTap: () => {
                    tapsA += 1;
                },
            }),
            A_REGION,
        );
        const buttonB = place(
            uiButton({
                width: B_REGION.width,
                height: B_REGION.height,
                background: colorBackground("b-normal"),
                pressedBackground: colorBackground("b-pressed"),
                onTap: () => {
                    tapsB += 1;
                },
            }),
            B_REGION,
        );
        const ui = () => placedRoot({ children: [buttonA, buttonB] });

        harness.render(ui());
        harness.pointerDown(A_CENTER);
        harness.pointerMove(B_CENTER);
        harness.render(ui());
        assert.deepStrictEqual(
            fills(harness.rects),
            ["a-normal", "b-normal"],
            "neither button is pressed mid-slide",
        );

        const handled = harness.pointerUp(B_CENTER);
        assert.strictEqual(handled, true, "the gesture is absorbed by the UI");
        assert.strictEqual(tapsA, 0);
        assert.strictEqual(tapsB, 0);
    });

    it("absorbs a release outside the pressed button without tapping", () => {
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
        const handled = harness.pointerUp(OUTSIDE);
        harness.render(ui());

        assert.strictEqual(
            handled,
            true,
            "a gesture that began on the button belongs to the UI",
        );
        assert.strictEqual(taps, 0, "release outside fires no tap");
        assert.deepStrictEqual(fills(harness.rects), ["normal"]);
    });

    it("a press that began outside the UI does not tap a button it releases on", () => {
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
        const captured = harness.pointerDown(OUTSIDE);
        assert.strictEqual(captured, false, "press misses the UI");

        const handled = harness.pointerUp(A_CENTER);
        assert.strictEqual(handled, false, "the gesture never belonged to the UI");
        assert.strictEqual(taps, 0);
    });

    it("absorbs the release when the pressed button unmounts mid-press", () => {
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

        harness.render(placedRoot({ children: [button] }));
        harness.pointerDown(A_CENTER);
        harness.render(placedRoot({ children: [] }));

        const handled = harness.pointerUp(A_CENTER);
        assert.strictEqual(
            handled,
            true,
            "the gesture is absorbed even though the button is gone",
        );
        assert.strictEqual(taps, 0, "an unmounted button cannot tap");
    });
});
