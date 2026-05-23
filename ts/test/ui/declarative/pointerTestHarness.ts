import type { Point } from "../../../src/common/point.ts";
import type { RenderScope } from "../../../src/rendering/renderScope.ts";
import {
    UiRenderer,
    type ComponentDescriptor,
} from "../../../src/ui/declarative/ui.ts";

/**
 * A rectangle draw captured from the fake render scope. Backgrounds
 * (e.g. ColorBackground) draw via `drawScreenSpaceRectangle`, so the captured
 * `fill` tells a test which background a component rendered — the observable
 * proof of its pressed/normal state.
 */
export type CapturedRect = {
    fill: string;
    x: number;
    y: number;
    width: number;
    height: number;
};

/**
 * Drives a real `UiRenderer` headlessly so interaction can be tested end to end:
 * render a tree, send pointer events, re-render, and inspect what was drawn.
 *
 * Mirrors the real loop where every input is followed by a render — call
 * {@link PointerHarness.render} after a pointer event to observe the resulting
 * visual state, exactly as the game/devApp do.
 */
export type PointerHarness = {
    /** Render (or re-render) the tree. Clears the captured rects first. */
    render(descriptor: ComponentDescriptor | null): void;
    /** @returns whether the press landed on an interactive component. */
    pointerDown(point: Point): boolean;
    /** @returns whether a tap handler fired. */
    pointerUp(point: Point): boolean;
    /** Abandon the current press (drag/cancel). */
    pointerCancel(): void;
    /** Rectangles drawn during the most recent render, in draw order. */
    rects: CapturedRect[];
};

/**
 * Builds a {@link PointerHarness} backed by a fake `RenderScope` that supplies
 * the canvas size, a deterministic text measurer (8px per char), and a
 * rectangle-capturing draw method — the only render-scope surface the renderer
 * and simple backgrounds touch.
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
