import type { Point } from "../../src/common/point.ts";

/**
 * A stand-in for the canvas element TouchInput listens on. TouchInput only
 * needs addEventListener, so the fake records the listeners and lets a test
 * fire synthetic mouse and touch events at them.
 */
export type FakeCanvas = {
    /** Cast this to HTMLCanvasElement-typed parameters. */
    element: HTMLCanvasElement;
    /** Fire a mouse event ("mousedown", "mousemove", "mouseup", ...). */
    fireMouse(type: string, position: Point): void;
    /** Fire a touch event with a single touch point ("touchstart", ...). */
    fireTouch(type: string, position?: Point): void;
};

export function createFakeCanvas(): FakeCanvas {
    const listeners = new Map<string, ((event: unknown) => void)[]>();

    const element = {
        addEventListener(type: string, listener: (event: unknown) => void) {
            const existing = listeners.get(type) ?? [];
            existing.push(listener);
            listeners.set(type, existing);
        },
    } as unknown as HTMLCanvasElement;

    function fire(type: string, event: object) {
        const fireable = listeners.get(type) ?? [];
        for (const listener of fireable) {
            listener({ preventDefault: () => {}, ...event });
        }
    }

    return {
        element,
        fireMouse(type, position) {
            fire(type, { clientX: position.x, clientY: position.y });
        },
        fireTouch(type, position) {
            fire(type, {
                touches: position
                    ? [{ clientX: position.x, clientY: position.y }]
                    : [],
            });
        },
    };
}
