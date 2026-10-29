import { describe, it } from "node:test";
import assert from "node:assert";
import { colorBackground } from "../../../src/ui/uiBackground.ts";
import {
    createComponent,
    type ComponentDescriptor,
    type PlacedChild,
} from "../../../src/ui/declarative/ui.ts";
import { uiButton } from "../../../src/ui/declarative/uiButton.ts";
import { Direction } from "../../../src/common/direction.ts";
import { createPointerHarness } from "./pointerTestHarness.ts";

// Places already-built children at explicit offsets so each button's region is
// known. The offsets stay off 0,0 so an offset bug can't hide.
const placedRoot = createComponent<{ children: PlacedChild[] }>(
    ({ props }) => ({
        size: { width: 200, height: 120 },
        children: props.children,
    }),
);

// Like placedRoot, but sized by its props so it can sit inside a button
// without being centred off its intended origin.
const sizedLayout = createComponent<{
    width: number;
    height: number;
    children: PlacedChild[];
}>(({ props }) => ({
    size: { width: props.width, height: props.height },
    children: props.children,
}));

type Region = { x: number; y: number; width: number; height: number };

const LEFT = { x: 12, y: 10, width: 40, height: 30 };
const RIGHT = { x: 80, y: 10, width: 40, height: 30 };

function place(descriptor: ComponentDescriptor, region: Region): PlacedChild {
    return {
        ...descriptor,
        offset: { x: region.x, y: region.y },
        size: { width: region.width, height: region.height },
    };
}

function button(region: Region, onTap?: () => void, key?: string): PlacedChild {
    return place(
        uiButton({
            width: region.width,
            height: region.height,
            background: colorBackground("normal"),
            onTap,
            key,
        }),
        region,
    );
}

function boundsOf(region: Region) {
    return {
        x1: region.x,
        y1: region.y,
        x2: region.x + region.width,
        y2: region.y + region.height,
    };
}

describe("keyboard focus (Scenario)", () => {
    it("the first press shows focus at the top left instead of moving it", () => {
        const harness = createPointerHarness();
        harness.render(
            placedRoot({
                children: [button(RIGHT, () => {}), button(LEFT, () => {})],
            }),
        );

        assert.strictEqual(harness.focus.focusedBounds(), null);
        assert.strictEqual(harness.focus.moveFocus(Direction.Right), true);
        assert.deepStrictEqual(
            harness.focus.focusedBounds(),
            boundsOf(LEFT),
        );
    });

    it("moves by direction and refuses to move past the last button", () => {
        const harness = createPointerHarness();
        harness.render(
            placedRoot({
                children: [button(LEFT, () => {}), button(RIGHT, () => {})],
            }),
        );
        harness.focus.enterFocus(null);

        assert.strictEqual(harness.focus.moveFocus(Direction.Right), true);
        assert.deepStrictEqual(
            harness.focus.focusedBounds(),
            boundsOf(RIGHT),
        );
        assert.strictEqual(harness.focus.moveFocus(Direction.Right), false);
        assert.deepStrictEqual(
            harness.focus.focusedBounds(),
            boundsOf(RIGHT),
        );
    });

    it("the action key runs the focused button's tap handler once", () => {
        const harness = createPointerHarness();
        let taps = 0;
        harness.render(
            placedRoot({
                children: [
                    button(LEFT, () => {
                        taps += 1;
                    }),
                ],
            }),
        );
        harness.focus.enterFocus(null);

        assert.strictEqual(harness.focus.activateFocused(), true);
        assert.strictEqual(taps, 1);
    });

    it("skips buttons without a tap handler, as a disabled button has none", () => {
        const harness = createPointerHarness();
        harness.render(
            placedRoot({ children: [button(LEFT), button(RIGHT, () => {})] }),
        );

        harness.focus.enterFocus(null);
        assert.deepStrictEqual(
            harness.focus.focusedBounds(),
            boundsOf(RIGHT),
        );
    });

    it("never moves from a button to a focusable card wrapping it", () => {
        const harness = createPointerHarness();
        const card = { x: 10, y: 5, width: 60, height: 60 };
        // Relative to the card, so the inner button sits at 15,10 on screen
        const inner = { x: 5, y: 5, width: 20, height: 20 };
        const sibling = { x: 120, y: 15, width: 20, height: 20 };
        const cardButton = place(
            uiButton({
                width: card.width,
                height: card.height,
                onTap: () => {},
                child: sizedLayout({
                    width: card.width,
                    height: card.height,
                    children: [button(inner, () => {})],
                }),
            }),
            card,
        );
        harness.render(
            placedRoot({ children: [cardButton, button(sibling, () => {})] }),
        );

        harness.focus.enterFocus({ x1: 25, y1: 20, x2: 25, y2: 20 });
        assert.deepStrictEqual(harness.focus.focusedBounds(), {
            x1: 15,
            y1: 10,
            x2: 35,
            y2: 30,
        });

        // The card wraps the inner button, so it lies in every direction from
        // it and would win if it were not skipped as a relative.
        harness.focus.moveFocus(Direction.Right);
        assert.deepStrictEqual(
            harness.focus.focusedBounds(),
            boundsOf(sibling),
        );
    });

    it("moves focus to the nearest button when the focused one unmounts", () => {
        const harness = createPointerHarness();
        const middle = { x: 60, y: 10, width: 20, height: 30 };
        const far = { x: 160, y: 10, width: 20, height: 30 };
        harness.render(
            placedRoot({
                children: [
                    button(LEFT, () => {}, "left"),
                    button(middle, () => {}, "middle"),
                    button(far, () => {}, "far"),
                ],
            }),
        );
        harness.focus.enterFocus(boundsOf(middle));
        assert.deepStrictEqual(
            harness.focus.focusedBounds(),
            boundsOf(middle),
        );

        harness.render(
            placedRoot({
                children: [
                    button(LEFT, () => {}, "left"),
                    button(far, () => {}, "far"),
                ],
            }),
        );

        assert.deepStrictEqual(
            harness.focus.focusedBounds(),
            boundsOf(LEFT),
        );
    });

    it("moves focus off a button that stops being pressable", () => {
        const harness = createPointerHarness();
        // Like a scroll arrow that disables itself once it reaches the end
        const ui = (rightEnabled: boolean) =>
            placedRoot({
                children: [
                    button(LEFT, () => {}, "left"),
                    button(RIGHT, rightEnabled ? () => {} : undefined, "right"),
                ],
            });
        harness.render(ui(true));
        harness.focus.enterFocus(boundsOf(RIGHT));

        harness.render(ui(false));

        assert.deepStrictEqual(
            harness.focus.focusedBounds(),
            boundsOf(LEFT),
        );
    });

    it("a pointer press hides focus and the next key resumes where it pressed", () => {
        const harness = createPointerHarness();
        harness.render(
            placedRoot({
                children: [button(LEFT, () => {}), button(RIGHT, () => {})],
            }),
        );
        harness.focus.enterFocus(null);

        harness.pointerDown({ x: 100, y: 25 });
        harness.pointerUp({ x: 100, y: 25 });
        assert.strictEqual(harness.focus.focusedBounds(), null);

        harness.focus.moveFocus(Direction.Down);
        assert.deepStrictEqual(
            harness.focus.focusedBounds(),
            boundsOf(RIGHT),
        );
    });
});
