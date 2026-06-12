import { invert, type Point } from "../common/point.ts";
import { TouchInput } from "../input/touchInput.ts";
import type { Camera } from "../rendering/camera.ts";
import type { OnTapEndEvent } from "../input/touchInput.ts";
import type { InteractionHandler } from "./interaction/handler/interactionHandler.ts";

/**
 * Routes raw touch gestures between the interaction handler and the camera.
 * A gesture that starts on the UI (or a modal) belongs to the interaction
 * handler for its whole lifetime; otherwise dragging pans the camera. Lives
 * outside Game so tests can drive the exact same routing headlessly.
 */
export function wireGameInput(
    touchInput: TouchInput,
    interactionHandler: InteractionHandler,
    camera: Camera,
    render: () => void,
): void {
    touchInput.onTapDown = (position: Point) => {
        const tapResult = interactionHandler.onTapDown(position);
        render();
        return tapResult;
    };

    touchInput.onPan = (
        movement: Point,
        position: Point,
        startPosition: Point,
        downTapHandled: boolean,
    ) => {
        if (downTapHandled) {
            interactionHandler.onTapPan(movement, position, startPosition);
        } else {
            camera.translate(invert(movement));
        }

        render();
    };

    touchInput.onTapEnd = (tapEndEvent: OnTapEndEvent) => {
        interactionHandler.onTapUp(tapEndEvent);
        render();
    };

    touchInput.onTapCancel = () => {
        interactionHandler.onTapCancel();
        render();
    };
}
