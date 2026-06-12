import { AssetLoader } from "../../../src/asset/loader/assetLoader.ts";
import { EcsWorld } from "../../../src/common/ecs/ecsWorld.ts";
import type { Point } from "../../../src/common/point.ts";
import { GameTime } from "../../../src/common/time.ts";
import { wireGameInput } from "../../../src/game/gameInput.ts";
import { InteractionHandler } from "../../../src/game/interaction/handler/interactionHandler.ts";
import type { InteractionState } from "../../../src/game/interaction/handler/interactionState.ts";
import { createRootEntity } from "../../../src/game/rootFactory.ts";
import { TouchInput } from "../../../src/input/touchInput.ts";
import { Camera } from "../../../src/rendering/camera.ts";
import type { RenderScope } from "../../../src/rendering/renderScope.ts";
import { UiRenderer } from "../../../src/ui/declarative/ui.ts";
import { createFakeCanvas } from "../../input/fakeCanvas.ts";
import type { FakeCanvas } from "../../input/fakeCanvas.ts";
import type { CapturedRect } from "../../ui/declarative/pointerTestHarness.ts";

/**
 * Drives the real input stack headlessly: synthetic canvas events run through
 * a real TouchInput, the real game input wiring, a real InteractionHandler and
 * a real UiRenderer. Only the render scope is fake, so a test can both fire
 * gestures the way a browser would and read what the HUD drew.
 */
export type GestureHarness = {
    camera: Camera;
    world: EcsWorld;
    canvas: FakeCanvas;
    /** Rectangles drawn during the most recent render, in draw order. */
    rects: CapturedRect[];
    /** Pushes an interaction state and re-renders the HUD. */
    pushState(state: InteractionState): void;
    /** The currently active interaction state. */
    currentState(): InteractionState;
    /** Re-render the HUD. Input events already render via the game wiring. */
    render(): void;
    /** Center of the first drawn rect with this fill. Throws when missing. */
    centerOf(fill: string): Point;
    /** A full mouse gesture: down at the first point, up at the last, moves between. */
    mouseGesture(points: Point[]): void;
    /** A touch press followed by a system cancel instead of an up. */
    touchCancelGesture(down: Point, moves?: Point[]): void;
};

export function createGestureHarness(): GestureHarness {
    const rects: CapturedRect[] = [];

    const scopeBase = {
        get size() {
            return { width: 800, height: 600 };
        },
        measureText: (text: string) => ({
            width: text.length * 8,
            height: 16,
        }),
        drawScreenSpaceRectangle: (config: CapturedRect) => {
            rects.push({
                fill: config.fill,
                x: config.x,
                y: config.y,
                width: config.width,
                height: config.height,
            });
        },
    };
    // The HUD reaches for more draw methods than the tests assert on (text,
    // sprites). Those become no-ops so any state's view can render.
    const scope = new Proxy(scopeBase, {
        get(target, property) {
            if (property in target) {
                return target[property as keyof typeof target];
            }
            return () => {};
        },
    }) as unknown as RenderScope;

    const canvas = createFakeCanvas();
    const touchInput = new TouchInput(canvas.element);
    const uiRenderer = new UiRenderer(scope);
    const world = new EcsWorld(createRootEntity());
    const camera = new Camera({ x: 800, y: 600 });
    const handler = new InteractionHandler(
        world,
        camera,
        new AssetLoader(),
        new GameTime(),
        uiRenderer,
        () => {},
        () => {},
    );

    const render = () => {
        rects.length = 0;
        handler.onDraw(scope);
    };

    // Headless: no animation frames, so pan renders synchronously like the
    // discrete gestures — the harness asserts routing, not render coalescing.
    wireGameInput(touchInput, handler, camera, render, render);

    // The push and state accessors reach into the handler's private history;
    // the handler exposes no public way to seed a specific state for a test.
    const handlerInternals = handler as unknown as {
        history: {
            state: InteractionState;
            push(state: InteractionState): void;
        };
    };

    const harness: GestureHarness = {
        camera,
        world,
        canvas,
        rects,
        pushState(state) {
            handlerInternals.history.push(state);
            render();
        },
        currentState() {
            return handlerInternals.history.state;
        },
        render,
        centerOf(fill) {
            const rect = rects.find((drawn) => drawn.fill === fill);
            if (!rect) {
                throw new Error(`No rect drawn with fill ${fill}`);
            }
            return {
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
            };
        },
        mouseGesture(points) {
            canvas.fireMouse("mousedown", points[0]);
            for (const point of points.slice(1, -1)) {
                canvas.fireMouse("mousemove", point);
            }
            canvas.fireMouse("mouseup", points[points.length - 1]);
        },
        touchCancelGesture(down, moves = []) {
            canvas.fireTouch("touchstart", down);
            for (const move of moves) {
                canvas.fireTouch("touchmove", move);
            }
            canvas.fireTouch("touchcancel");
        },
    };

    render();
    return harness;
}
