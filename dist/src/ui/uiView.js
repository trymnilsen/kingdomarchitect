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
import { withinRectangle } from "../common/bounds.js";
import { Event } from "../common/event.js";
import { addPoint, zeroPoint } from "../common/point.js";
import { isTapEvent, tapStartType, tapType, tapUpType } from "./event/uiEvent.js";
import { getClosestFocusableView, getFocusableViews } from "./focus/focusHelpers.js";
import { FocusState } from "./focus/focusState.js";
import { fillUiSize, zeroSize } from "./uiSize.js";
/**
 * UIView is the base class for all UI elements, it supports basic functions
 * for getting and setting size and position, as well as handling input events.
 * It also supports a simple focus system. It is not intended to be used
 * directly but rather extended by other classes. Internally is has a list of
 * child views this is not exposed publicly as there will be extended views
 * that does not allow children (For example text views, or image views).
 * If you are making a view that can have children for dynamic layouting, like
 * a row or a column you should extend the uiViewGroup class which exposes the
 * addView and removeView methods publicly.
 */ export class UIView {
    /**
     * The offset of this view from its parent
     */ get offset() {
        return this._offset;
    }
    set offset(value) {
        this._offset = value;
    }
    /**
     * The wanted size of this view. For the final size see `_measuredSize`.
     */ get size() {
        return this._size;
    }
    set size(size) {
        this._size = size;
    }
    /**
     * The id of this view
     */ get id() {
        return this._id;
    }
    set id(id) {
        this._id = id;
    }
    /**
     * The parent of this view
     */ get parent() {
        return this._parent;
    }
    set parent(parent) {
        this._parent = parent;
    }
    /**
     * The position of this view in screenspace
     */ get screenPosition() {
        return this._screenPosition;
    }
    set screenPosition(position) {
        this._screenPosition = position;
    }
    /**
     * Return the measured size of this view.
     * Will be zero if `isLayedOut` is false
     */ get measuredSize() {
        return this._measuredSize || zeroSize();
    }
    /**
     * Has this view previously been layed out and have a measured size?
     */ get isLayedOut() {
        return !!this._measuredSize;
    }
    /**
     * Returns a collection of the direct children of this view. For all nested
     * views use the `getViews` method.
     */ get children() {
        return this._children;
    }
    /**
     * Does this view have changes since last time it was layed out
     */ get isDirty() {
        return this._isDirty;
    }
    /**
     * The source of UI events triggered on this view
     */ get uiAction() {
        return this._uiAction;
    }
    /**
     * Is this view considered focusable? If a view is focusable it will
     * able considered for keyboard and directional navigation
     */ get isFocusable() {
        return false;
    }
    /**
     * The corners in a clockwise order. Will return an array of four points.
     * Note: If the view has not been layed out they will all be the value of
     * the default screenPosition.
     */ get corners() {
        if (!!this._measuredSize) {
            return [
                //Top left
                this._screenPosition,
                //Top right
                addPoint(this._screenPosition, {
                    x: this._measuredSize.width,
                    y: 0
                }),
                //Bottom right
                addPoint(this._screenPosition, {
                    x: this._measuredSize.width,
                    y: this._measuredSize.height
                }),
                //Bottom left
                addPoint(this._screenPosition, {
                    x: 0,
                    y: this._measuredSize.height
                })
            ];
        } else {
            return [
                this._screenPosition,
                this._screenPosition,
                this._screenPosition,
                this._screenPosition
            ];
        }
    }
    /**
     * The center position of this view.
     * Note: if the view has not been layed out the position will be the same
     * as the screen position
     */ get center() {
        if (!!this._measuredSize) {
            const halfWidth = this._measuredSize.width / 2;
            const halfHeight = this._measuredSize.height / 2;
            return addPoint(this._screenPosition, {
                x: halfWidth,
                y: halfHeight
            });
        } else {
            return this._screenPosition;
        }
    }
    /**
     * Returns the bounds of this view
     * Note: if the view has not been layed out the x2 and y2 components will
     * be the same as the x1 and y1
     */ get bounds() {
        if (!!this._measuredSize) {
            return {
                x1: this.screenPosition.x,
                x2: this._screenPosition.x + this._measuredSize.width,
                y1: this._screenPosition.y,
                y2: this._screenPosition.y + this._measuredSize.height
            };
        } else {
            return {
                x1: this.screenPosition.x,
                x2: this._screenPosition.x,
                y1: this._screenPosition.y,
                y2: this._screenPosition.y
            };
        }
    }
    /**
     * The current focus state attached to this view. Will attempt to traverse
     * up the tree if this view is attatched to a parent to find the root focus
     * state. If there is no parent a new focus state will be made if the is
     * one.
     */ get focusState() {
        if (!!this._parent) {
            return this._parent.focusState;
        } else {
            if (!this._focusState) {
                this._focusState = new FocusState();
            }
            return this._focusState;
        }
    }
    /**
     * Dispose the resources this view is holding. Will be called when the view
     * is removed from the interaction state or if this view is a child of
     * another view and it is being removed from that view.
     * Any inherited classes should call super.dispose to ensure that all
     * resources are properly handled.
     */ dispose() {
        for (const child of this._children){
            child.dispose();
        }
        this._parent = null;
        this._uiAction.dispose();
    }
    /**
     * Visit and return all views (including self and nested).
     * @param filter optional filter to apply to children returned
     */ getViews(filter) {
        const views = [];
        const viewsToFilter = [
            this
        ];
        while(viewsToFilter.length > 0){
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const view = viewsToFilter.pop();
            // If there is a filter and it matches or there is no filter
            // add the view to the returned list of views
            if (filter && filter(view) || !filter) {
                views.push(view);
            }
            for (const child of view._children){
                viewsToFilter.push(child);
            }
        }
        return views;
    }
    /**
     * Update the screen position of the children for this view based on their
     * offset position
     */ updateTransform() {
        if (this.parent) {
            this._screenPosition = addPoint(this.parent.screenPosition, this._offset);
        } else {
            this.screenPosition = this._offset;
        }
        for (const child of this._children){
            child.updateTransform();
        }
    }
    /**
     * Checks if the point is within the bounds of this view. Mostly used for
     * checking if a tap is considered inside this view. Does not handle the
     * hit testing, this is handled by `hitTest`.
     * @param point the point in screen space to test if is within this view
     * @returns true if within, false if not
     */ withinViewBounds(point) {
        return withinRectangle(point, this.screenPosition.x, this.screenPosition.y, this.screenPosition.x + this.measuredSize.width, this.screenPosition.y + this.measuredSize.height);
    }
    /**
     * Called when a tap is registered down. Will only trigged if the
     * screenpoint is considered within this view
     * @param screenPoint the position the tap started at
     * @returns true if this tap was consumed by this view. Defaults to false
     */ onTapDown(screenPoint) {
        return false;
    }
    /**
     * Called when a tap is registered as no-longer down.
     * @param screenPoint the position of this tap event
     */ onTapUp(screenPoint, isCancelled) {}
    /**
     * Called when a tap is registered as both up and down within this view.
     * @param screenPoint the position this event occured at.
     * @returns true if this tap was handled by the view. Defaults to false
     */ onTap(screenPoint) {
        return false;
    }
    onFocus() {}
    onFocusLost() {}
    /**
     * Bubble a `UIAction` upwards to parents.
     * Will first trigger the views `uiAction` event listeners and then pass
     * on the action to any parents.
     * @param action the action to bubble upwards
     */ bubbleAction(action) {
        this._uiAction.publish(action);
        if (this._parent) {
            this._parent.bubbleAction(action);
        }
    }
    /**
     * Dispatch a UIEvent. Will check if the event is within the bounds of this
     * view and dispatch it to children if it is.
     * @param event the event to dispatch
     * @returns if the event was consumed by any children
     */ dispatchUIEvent(event) {
        if (isTapEvent(event)) {
            return this.dispatchTapEvent(event);
        } else if (event.type == "direction") {
            const directionalResult = this.handleDirectionEvent(event);
            return directionalResult;
        } else {
            console.warn("Unrecognised event type: ", event);
            //Input type was not recognised so it will not be handled
            return false;
        }
    }
    /**
     * Adds a child view to the view. Views added should not have a parent.
     * @param view the view to add
     */ addView(view) {
        if (view.parent != null) {
            throw new Error("Attempted to add view already added to a parent");
        }
        if (view === this) {
            throw new Error("Cannot add view to itself");
        }
        view.parent = this;
        this._children.push(view);
    }
    /**
     * Removes a child view from this view. Will call dispose on the
     * view that is removed from this view
     * @param view the view to remove
     */ removeView(view) {
        view.dispose();
        this._children = this._children.filter((child)=>child != view);
    }
    clearViews() {
        for (const child of this._children){
            child.dispose();
        }
        this._children = [];
    }
    /**
     * Dispatch a tap event to this view and its children to
     * check if its handled
     * @param event the tap event that occured
     * @returns if the event was handled
     */ dispatchTapEvent(event) {
        // check if this view is within bounds, this depends on different
        // logic based on the event type. See the documentation for
        // `isUITapEventWithinBounds` for more information.
        // We do a bounds check here before propegating the event to children
        // to avoid passing it down unnecessarily
        const withinBounds = this.isUITapEventWithinBounds(event);
        // If the event is not within our bounds we do not pass it on
        if (!withinBounds) {
            return false;
        }
        // Pass it on to children, allowing the deepest child to handle the
        // event first
        for (const child of this.children){
            const childResult = child.dispatchUIEvent(event);
            if (childResult) {
                return childResult;
            }
        }
        // if we get here the children did not handle the event so we check if
        // this view wants to handle it
        if (event.type == tapType) {
            // Check if both the start and end event is within bounds
            const startHitTest = this.hitTest(event.startPosition);
            const endHitTest = this.hitTest(event.position);
            if (startHitTest && endHitTest) {
                // If both start and end is hit
                console.log("View: Tap up withing view", this);
                this.onTapUp(event.position, false);
                const tapResult = this.onTap(event.position);
                return tapResult;
            }
        } else if (event.type == tapUpType) {
            const startHitTest = this.hitTest(event.startPosition);
            const endHitTest = this.hitTest(event.position);
            if (startHitTest && !endHitTest) {
                this.onTapUp(event.position, true);
                return false;
            }
        } else if (event.type == tapStartType) {
            // The tap was started, we need no more logic as we already know
            // from `this.isUITapEventWithinBounds` that the tap is intended
            // for this view
            if (this.hitTest(event.position)) {
                console.log("View: Tap down on view", this);
                const tapResult = this.onTapDown(event.position);
                return tapResult;
            }
        } else {
            console.warn("Encountered unknown UITapEvent type", event);
        }
        return false;
    }
    /**
     * Handle the input event by attempting to focus the closest
     * focusable view in the whole view hierachy of this view and its children,
     * in the direction of the event. Will change the focus of this
     * view hierachy if there is a view considered adjacent.
     * @param event the input event to handle
     * @returns true if there was a view to focus, false if not
     *
     */ handleDirectionEvent(event) {
        const currentlyFocusedView = this.focusState.currentFocus;
        //Allow the currently focused view to handle the event if wanted
        if (!!currentlyFocusedView) {
            const handledEvent = currentlyFocusedView.dispatchUIEvent(event);
            if (handledEvent) {
                return true;
            }
        }
        //Get all the focusable views
        const focusableViews = getFocusableViews(this);
        if (!!currentlyFocusedView) {
            //Find the view from the directional sector that has an edge
            // closest to currently selected view
            const closestView = getClosestFocusableView(focusableViews, currentlyFocusedView, event.direction);
            if (!!closestView) {
                this.focusState.setFocus(closestView);
                return true;
            } else {
                return false;
            }
        } else {
            //No current focus exist so we pick the view closest to the top left
            const firstFocusResult = this.focusState.setFirstFocus(focusableViews);
            return firstFocusResult;
        }
    }
    /**
     * Check if the tap event is within the bounds of this view.
     * Based on the type we use a different property
     * @param uiEvent The tap event to check if is within bounds
     */ isUITapEventWithinBounds(uiEvent) {
        if (uiEvent.type == "tapStart") {
            return this.withinViewBounds(uiEvent.position);
        } else if (uiEvent.type == "tap") {
            return this.withinViewBounds(uiEvent.startPosition) && this.withinViewBounds(uiEvent.position);
        } else {
            return this.withinViewBounds(uiEvent.startPosition);
        }
    }
    constructor(size){
        _define_property(this, "_parent", null);
        _define_property(this, "_screenPosition", zeroPoint());
        _define_property(this, "_offset", zeroPoint());
        _define_property(this, "_size", void 0);
        _define_property(this, "_id", null);
        _define_property(this, "_children", []);
        _define_property(this, "_uiAction", new Event());
        _define_property(this, "_focusState", void 0);
        _define_property(this, "_measuredSize", null);
        _define_property(this, "_isDirty", true);
        if (size.width < fillUiSize) {
            throw new Error(`Invalid ui width provided: ${size.width}`);
        }
        if (size.height < fillUiSize) {
            throw new Error(`Invalid ui height provided: ${size.height}`);
        }
        this._size = size;
    }
}
