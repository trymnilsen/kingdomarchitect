import { Event, EventListener } from "../common/event";
import { distance, Point, subtractPoint } from "../common/point";

export interface OnPanEvent {
    movement: Point;
    position: Point;
}

export class DragInput {
    private canvasElement: HTMLCanvasElement;
    private isDragging: boolean = false;
    private onTapPosition: Point | null = null;
    private previousMovePosition: Point | null = null;
    private _onPan: Event<OnPanEvent>;

    public get onPan(): EventListener<OnPanEvent> {
        return this._onPan;
    }

    constructor(canvasElement: HTMLCanvasElement) {
        this.canvasElement = canvasElement;
        this._onPan = new Event();
        canvasElement.addEventListener(
            "touchstart",
            (event) => {
                event.preventDefault();
                this.onTap({
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
                this.onTap({
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
                this.onTapEnded();
            },
            { passive: false }
        );
        canvasElement.addEventListener(
            "mouseout",
            (event) => {
                event.preventDefault();
                this.onTapEnded();
            },
            { passive: false }
        );
        canvasElement.addEventListener(
            "mouseup",
            (event) => {
                event.preventDefault();
                this.onTapEnded();
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
    private onTap(position: Point) {
        console.log("onTap: ", position);
        this.onTapPosition = position;
    }

    private onDrag(position: Point) {
        if (this.isDragging && this.previousMovePosition) {
            const movement = subtractPoint(position, this.previousMovePosition);
            this._onPan.publish({
                movement: movement,
                position: position,
            });
        } else if (this.onTapPosition != null) {
            if (distance(this.onTapPosition, position) > 5) {
                this.isDragging = true;
            }
        }
        this.previousMovePosition = position;
    }

    private onTapEnded() {
        if (this.isDragging || this.onTapPosition) {
            this.isDragging = false;
            this.onTapPosition = null;
            this.previousMovePosition = null;
            console.log("tap ended");
        }
    }
}
