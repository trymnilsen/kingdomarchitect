import { log } from "../common/logging/logger.ts";
import { distance, subtractPoint } from "../common/point.ts";
import type { Point } from "../common/point.ts";

export type OnPanEvent = {
    movement: Point;
    position: Point;
};

export type OnTapEndEvent = {
    position: Point;
    startPosition: Point;
    wasDragging: boolean;
};

export type OnTapDownCallback = (position: Point) => boolean;
export type OnTapCallback = (tapEndEvent: OnTapEndEvent) => void;
export type OnPanCallback = (
    movement: Point,
    position: Point,
    startPosition: Point,
    downTapHandled: boolean,
) => void;
export type OnStartDragCallback = (
    tapStart: Point,
    dragStart: Point,
) => boolean;

export class TouchInput {
    private isDragging = false;
    private onTapPosition: Point | null = null;
    private previousMovePosition: Point | null = null;
    private tapHandled = false;

    onPan: OnPanCallback | null = null;
    onStartDrag: OnStartDragCallback | null = null;
    onTapEnd: OnTapCallback | null = null;
    onTapDown: OnTapDownCallback | null = null;
    onTapCancel: (() => void) | null = null;

    constructor(canvasElement: HTMLCanvasElement) {
        canvasElement.addEventListener(
            "touchstart",
            (event) => {
                event.preventDefault();
                this.onTapStart({
                    x: event.touches[0].clientX,
                    y: event.touches[0].clientY,
                });
            },
            { passive: false },
        );

        canvasElement.addEventListener(
            "mousedown",
            (event) => {
                event.preventDefault();
                this.onTapStart({
                    x: event.clientX,
                    y: event.clientY,
                });
            },
            { passive: false },
        );

        canvasElement.addEventListener(
            "mousemove",
            (event) => {
                event.preventDefault();
                this.onDrag({ x: event.clientX, y: event.clientY });
            },
            {
                passive: false,
            },
        );

        canvasElement.addEventListener(
            "touchmove",
            (event) => {
                event.preventDefault();
                const touch = event.touches[0];
                this.onDrag({ x: touch.clientX, y: touch.clientY });
            },
            { passive: false },
        );

        canvasElement.addEventListener(
            "mouseleave",
            (event) => {
                event.preventDefault();
                this.onTapEnded({
                    x: event.clientX,
                    y: event.clientY,
                });
            },
            { passive: false },
        );
        canvasElement.addEventListener(
            "mouseup",
            (event) => {
                event.preventDefault();
                this.onTapEnded({
                    x: event.clientX,
                    y: event.clientY,
                });
            },
            { passive: false },
        );
        canvasElement.addEventListener(
            "touchend",
            (event) => {
                event.preventDefault();
                this.onTapEnded();
            },
            { passive: false },
        );
        canvasElement.addEventListener(
            "touchcancel",
            (event) => {
                event.preventDefault();
                this.onTapCancelled();
            },
            { passive: false },
        );
    }
    private onTapStart(position: Point) {
        if (this.onTapDown) {
            this.tapHandled = this.onTapDown(position);
        }
        this.onTapPosition = position;
    }

    private onDrag(position: Point) {
        if (
            this.isDragging &&
            this.previousMovePosition &&
            this.onTapPosition
        ) {
            const movement = subtractPoint(position, this.previousMovePosition);
            if (this.onPan) {
                this.onPan(
                    movement,
                    position,
                    this.onTapPosition,
                    this.tapHandled,
                );
            }
        } else if (this.onTapPosition != null) {
            if (distance(this.onTapPosition, position) > 5) {
                this.isDragging = true;
            }
        }
        this.previousMovePosition = position;
    }

    private resetGesture() {
        this.tapHandled = false;
        this.isDragging = false;
        this.onTapPosition = null;
        this.previousMovePosition = null;
    }

    private onTapCancelled() {
        try {
            // The system took the touch over. Unlike an up this must never
            // count as a tap, so it gets its own callback instead of onTapEnd.
            if (this.onTapCancel && this.onTapPosition) {
                this.onTapCancel();
            }
        } catch (err) {
            log.error("Failed cancelling tap", { error: err });
        } finally {
            this.resetGesture();
        }
    }

    private onTapEnded(position: Point | null | undefined = undefined) {
        try {
            position = position ?? this.previousMovePosition;

            if (this.onTapEnd && this.onTapPosition) {
                //console.log(`TouchInput: Tap ended`, position, this.isDragging);
                this.onTapEnd({
                    // Substitute the onTapPosition as the end position if
                    // there is no position in the event or a previous
                    // pointer position registered
                    position: position ?? this.onTapPosition,
                    wasDragging: this.isDragging,
                    startPosition: this.onTapPosition,
                });
            }
        } catch (err) {
            log.error("Failed ending tap", { error: err });
        } finally {
            this.resetGesture();
        }
    }
}
