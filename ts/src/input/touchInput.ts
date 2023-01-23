import { distance, Point, subtractPoint } from "../common/point";

export interface OnPanEvent {
    movement: Point;
    position: Point;
}

export type OnTapDownCallback = (position: Point) => boolean;
export type OnPanCallback = (movement: Point, position: Point) => void;
export type OnTapUpCallback = (movement: Point) => void;
export type OnTapCallback = (position: Point) => void;

export class TouchInput {
    private isDragging: boolean = false;
    private onTapPosition: Point | null = null;
    private previousMovePosition: Point | null = null;
    private tapHandled: boolean = false;

    onPan: OnPanCallback | null = null;
    onTap: OnTapCallback | null = null;
    onTapDown: OnTapDownCallback | null = null;
    onTapUp: OnTapUpCallback | null = null;

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
            { passive: false }
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
            { passive: false }
        );

        canvasElement.addEventListener(
            "mousemove",
            (event) => {
                event.preventDefault();
                this.onDrag({ x: event.clientX, y: event.clientY });
            },
            {
                passive: false,
            }
        );

        canvasElement.addEventListener(
            "touchmove",
            (event) => {
                event.preventDefault();
                const touch = event.touches[0];
                this.onDrag({ x: touch.clientX, y: touch.clientY });
            },
            { passive: false }
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
            { passive: false }
        );
        canvasElement.addEventListener(
            "mouseout",
            (event) => {
                event.preventDefault();
                this.onTapEnded({
                    x: event.clientX,
                    y: event.clientY,
                });
            },
            { passive: false }
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
            { passive: false }
        );
        canvasElement.addEventListener(
            "touchend",
            (event) => {
                event.preventDefault();
                this.onTapEnded();
            },
            { passive: false }
        );
        canvasElement.addEventListener(
            "touchcancel",
            (event) => {
                event.preventDefault();
                this.onTapEnded();
            },
            { passive: false }
        );
    }
    private onTapStart(position: Point) {
        if (this.onTapDown) {
            this.tapHandled = this.onTapDown(position);
        }
        this.onTapPosition = position;
    }

    private onDrag(position: Point) {
        if (this.tapHandled) {
            return;
        }

        if (this.isDragging && this.previousMovePosition) {
            const movement = subtractPoint(position, this.previousMovePosition);
            if (this.onPan) {
                this.onPan(movement, position);
            }
        } else if (this.onTapPosition != null) {
            if (distance(this.onTapPosition, position) > 5) {
                this.isDragging = true;
            }
        }
        this.previousMovePosition = position;
    }

    private onTapEnded(position: Point | undefined = undefined) {
        try {
            if (this.isDragging) {
                //console.log("drag ended");
            } else if (this.onTapPosition && this.onTap) {
                if (!position) {
                    position = this.previousMovePosition || this.onTapPosition;
                }

                if (this.onTapUp) {
                    this.onTapUp(position);
                }
                this.onTap(position);
            }
        } catch (err) {
            console.error("Failed ending tap", err);
        } finally {
            this.tapHandled = false;
            this.isDragging = false;
            this.onTapPosition = null;
            this.previousMovePosition = null;
        }
    }
}
