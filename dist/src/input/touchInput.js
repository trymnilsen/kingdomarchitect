function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { distance, subtractPoint } from "../common/point.js";
export class TouchInput {
    onTapStart(position) {
        if (this.onTapDown) {
            this.tapHandled = this.onTapDown(position);
        }
        this.onTapPosition = position;
    }
    onDrag(position) {
        if (this.isDragging && this.previousMovePosition && this.onTapPosition) {
            const movement = subtractPoint(position, this.previousMovePosition);
            if (this.onPan) {
                this.onPan(movement, position, this.onTapPosition, this.tapHandled);
            }
        } else if (this.onTapPosition != null) {
            if (distance(this.onTapPosition, position) > 5) {
                console.log("Drag started");
                this.isDragging = true;
            }
        }
        this.previousMovePosition = position;
    }
    onTapEnded(position = undefined) {
        try {
            position = position || this.previousMovePosition;
            if (this.onTapEnd && this.onTapPosition) {
                //console.log(`TouchInput: Tap ended`, position, this.isDragging);
                this.onTapEnd({
                    // Substitute the onTapPosition as the end position if
                    // there is no position in the event or a previous
                    // pointer position registered
                    position: position || this.onTapPosition,
                    wasDragging: this.isDragging,
                    startPosition: this.onTapPosition
                });
            }
        } catch (err) {
            console.error("Failed ending tap", err);
        } finally{
            this.tapHandled = false;
            this.isDragging = false;
            this.onTapPosition = null;
            this.previousMovePosition = null;
        }
    }
    constructor(canvasElement){
        _define_property(this, "isDragging", false);
        _define_property(this, "onTapPosition", null);
        _define_property(this, "previousMovePosition", null);
        _define_property(this, "tapHandled", false);
        _define_property(this, "onPan", null);
        _define_property(this, "onStartDrag", null);
        _define_property(this, "onTapEnd", null);
        _define_property(this, "onTapDown", null);
        canvasElement.addEventListener("touchstart", (event)=>{
            event.preventDefault();
            this.onTapStart({
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            });
        }, {
            passive: false
        });
        canvasElement.addEventListener("mousedown", (event)=>{
            event.preventDefault();
            this.onTapStart({
                x: event.clientX,
                y: event.clientY
            });
        }, {
            passive: false
        });
        canvasElement.addEventListener("mousemove", (event)=>{
            event.preventDefault();
            this.onDrag({
                x: event.clientX,
                y: event.clientY
            });
        }, {
            passive: false
        });
        canvasElement.addEventListener("touchmove", (event)=>{
            event.preventDefault();
            const touch = event.touches[0];
            this.onDrag({
                x: touch.clientX,
                y: touch.clientY
            });
        }, {
            passive: false
        });
        canvasElement.addEventListener("mouseleave", (event)=>{
            event.preventDefault();
            this.onTapEnded({
                x: event.clientX,
                y: event.clientY
            });
        }, {
            passive: false
        });
        canvasElement.addEventListener("mouseout", (event)=>{
            event.preventDefault();
            this.onTapEnded({
                x: event.clientX,
                y: event.clientY
            });
        }, {
            passive: false
        });
        canvasElement.addEventListener("mouseup", (event)=>{
            event.preventDefault();
            this.onTapEnded({
                x: event.clientX,
                y: event.clientY
            });
        }, {
            passive: false
        });
        canvasElement.addEventListener("touchend", (event)=>{
            event.preventDefault();
            this.onTapEnded();
        }, {
            passive: false
        });
        canvasElement.addEventListener("touchcancel", (event)=>{
            event.preventDefault();
            this.onTapEnded();
        }, {
            passive: false
        });
    }
}
