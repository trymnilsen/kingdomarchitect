import { Event, EventListener } from "../common/event";
import { distance, Point, subtractPoint } from "../common/point";

export interface OnPanEvent {
    movement: Point;
    position: Point;
}

export class TouchInput {
    private canvasElement: HTMLCanvasElement;
    private isDragging: boolean = false;
    private onTapPosition: Point | null = null;
    private previousMovePosition: Point | null = null;
    private _onPan: Event<OnPanEvent>;
    private _onTap: Event<Point>;

    public get onPan(): EventListener<OnPanEvent> {
        return this._onPan;
    }

    public get onTap(): EventListener<Point> {
        return this._onTap;
    }

    constructor(canvasElement: HTMLCanvasElement) {
        this.canvasElement = canvasElement;
        this._onPan = new Event();
        this._onTap = new Event();
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
    private onTapStart(position: Point) {
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
        if (this.isDragging) {
            console.log("drag ended");
        } else if (this.onTapPosition) {
            this._onTap.publish(this.onTapPosition);
            console.log("tap ended");
        }
        this.isDragging = false;
        this.onTapPosition = null;
        this.previousMovePosition = null;
    }
}
