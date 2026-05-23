import type { Point } from "../../../src/common/point.ts";
import type { RenderScope } from "../../../src/rendering/renderScope.ts";
import {
    UiRenderer,
    type ComponentDescriptor,
} from "../../../src/ui/declarative/ui.ts";

/**
 * A rectangle captured from the fake render scope. Backgrounds draw with
 * drawScreenSpaceRectangle, so the captured fill tells a test which background
 * a component drew. That is how a test sees pressed versus normal.
 */
export type CapturedRect = {
    fill: string;
    x: number;
    y: number;
    width: number;
    height: number;
};

/**
 * Drives a real UiRenderer with no canvas so interaction can be tested from end
 * to end. Render a tree, send pointer events, render again, and check what was
 * drawn. The real loop renders after every input, so call
 * {@link PointerHarness.render} after a pointer event to see the new state.
 */
export type PointerHarness = {
    /** Render or re-render the tree. Clears the captured rects first. */
    render(descriptor: ComponentDescriptor | null): void;
    /** @returns whether the press landed on an interactive component. */
    pointerDown(point: Point): boolean;
    /** @returns whether a tap handler ran. */
    pointerUp(point: Point): boolean;
    /** Abandon the current press, as on a drag or cancel. */
    pointerCancel(): void;
    /** Rectangles drawn during the most recent render, in draw order. */
    rects: CapturedRect[];
};

/**
 * Builds a {@link PointerHarness} backed by a fake RenderScope. The fake gives
 * the canvas size, a fixed text measurer at 8px per character, and a draw
 * method that records rectangles. That covers everything the renderer and the
 * simple backgrounds reach for.
 */
export function createPointerHarness(
    width: number = 200,
    height: number = 200,
): PointerHarness {
    const rects: CapturedRect[] = [];

    const scope = {
        get size() {
            return { width, height };
        },
        measureText: (text: string) => ({
            width: text.length * 8,
            height: 16,
        }),
        drawScreenSpaceRectangle: (config: {
            fill: string;
            x: number;
            y: number;
            width: number;
            height: number;
        }) => {
            rects.push({
                fill: config.fill,
                x: config.x,
                y: config.y,
                width: config.width,
                height: config.height,
            });
        },
    } as unknown as RenderScope;

    const renderer = new UiRenderer(scope);

    return {
        render(descriptor) {
            rects.length = 0;
            renderer.renderComponent(descriptor);
        },
        pointerDown: (point) => renderer.onPointerDown(point),
        pointerUp: (point) => renderer.onPointerUp(point),
        pointerCancel: () => renderer.onPointerCancel(),
        rects,
    };
}
