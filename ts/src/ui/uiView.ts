import { Bounds, withinRectangle } from "../common/bounds";
import { Event, EventListener } from "../common/event";
import { addPoint, Point, zeroPoint } from "../common/point";
import { UIRenderContext } from "../rendering/uiRenderContext";
import { isTapEvent, UIEvent, UIInputEvent, UITapEvent } from "./event/uiEvent";
import {
    getClosestFocusableView,
    getFocusableViews,
} from "./focus/focusHelpers";
import { FocusState } from "./focus/focusState";
import { UILayoutContext } from "./uiLayoutContext";
import { fillUiSize, UISize, zeroSize } from "./uiSize";

export interface UIAction {
    type: string;
    data: unknown;
}

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
 */
export abstract class UIView {
    private _parent: UIView | null = null;
    private _screenPosition: Point = zeroPoint();
    private _offset: Point = zeroPoint();
    private _size: UISize;
    private _id: string | null = null;
    private _children: UIView[] = [];
    private _uiAction: Event<UIAction> = new Event();
    private _focusState: FocusState | undefined;
    protected _measuredSize: UISize | null = null;
    protected _isDirty: boolean = true;

    /**
     * The offset of this view from its parent
     */
    get offset(): Point {
        return this._offset;
    }
    set offset(value: Point) {
        this._offset = value;
    }

    /**
     * The wanted size of this view. For the final size see `_measuredSize`.
     */
    get size(): UISize {
        return this._size;
    }

    set size(size: UISize) {
        this._size = size;
    }

    /**
     * The id of this view
     */
    get id(): string | null {
        return this._id;
    }

    set id(id: string | null) {
        this._id = id;
    }

    /**
     * The parent of this view
     */
    get parent(): UIView | null {
        return this._parent;
    }

    set parent(parent: UIView | null) {
        this._parent = parent;
    }

    /**
     * The position of this view in screenspace
     */
    get screenPosition(): Point {
        return this._screenPosition;
    }

    set screenPosition(position: Point) {
        this._screenPosition = position;
    }

    /**
     * Return the measured size of this view.
     * Will be zero if `isLayedOut` is false
     */
    get measuredSize(): UISize {
        return this._measuredSize || zeroSize();
    }

    /**
     * Has this view previously been layed out and have a measured size?
     */
    get isLayedOut(): boolean {
        return !!this._measuredSize;
    }

    /**
     * Returns a collection of the direct children of this view. For all nested
     * views use the `getViews` method.
     */
    get children(): UIView[] {
        return this._children;
    }

    /**
     * Does this view have changes since last time it was layed out
     */
    get isDirty(): boolean {
        return this._isDirty;
    }

    /**
     * The source of UI events triggered on this view
     */
    get uiAction(): EventListener<UIAction> {
        return this._uiAction;
    }

    /**
     * Is this view considered focusable? If a view is focusable it will
     * able considered for keyboard and directional navigation
     */
    get isFocusable(): boolean {
        return false;
    }

    /**
     * The corners in a clockwise order. Will return an array of four points.
     * Note: If the view has not been layed out they will all be the value of
     * the default screenPosition.
     */
    get corners(): Point[] {
        if (!!this._measuredSize) {
            return [
                //Top left
                this._screenPosition,
                //Top right
                addPoint(this._screenPosition, {
                    x: this._measuredSize.width,
                    y: 0,
                }),
                //Bottom right
                addPoint(this._screenPosition, {
                    x: this._measuredSize.width,
                    y: this._measuredSize.height,
                }),
                //Bottom left
                addPoint(this._screenPosition, {
                    x: 0,
                    y: this._measuredSize.height,
                }),
            ];
        } else {
            return [
                this._screenPosition,
                this._screenPosition,
                this._screenPosition,
                this._screenPosition,
            ];
        }
    }

    /**
     * The center position of this view.
     * Note: if the view has not been layed out the position will be the same
     * as the screen position
     */
    get center(): Point {
        if (!!this._measuredSize) {
            const halfWidth = this._measuredSize.width / 2;
            const halfHeight = this._measuredSize.height / 2;
            return addPoint(this._screenPosition, {
                x: halfWidth,
                y: halfHeight,
            });
        } else {
            return this._screenPosition;
        }
    }

    /**
     * Returns the bounds of this view
     * Note: if the view has not been layed out the x2 and y2 components will
     * be the same as the x1 and y1
     */
    get bounds(): Bounds {
        if (!!this._measuredSize) {
            return {
                x1: this.screenPosition.x,
                x2: this._screenPosition.x + this._measuredSize.width,
                y1: this._screenPosition.y,
                y2: this._screenPosition.y + this._measuredSize.height,
            };
        } else {
            return {
                x1: this.screenPosition.x,
                x2: this._screenPosition.x,
                y1: this._screenPosition.y,
                y2: this._screenPosition.y,
            };
        }
    }

    /**
     * The current focus state attached to this view. Will attempt to traverse
     * up the tree if this view is attatched to a parent to find the root focus
     * state. If there is no parent a new focus state will be made if the is
     * one.
     */
    get focusState(): FocusState {
        if (!!this._parent) {
            return this._parent.focusState;
        } else {
            if (!this._focusState) {
                this._focusState = new FocusState();
            }
            return this._focusState;
        }
    }

    constructor(size: UISize) {
        if (size.width < fillUiSize) {
            throw new Error(`Invalid ui width provided: ${size.width}`);
        }
        if (size.height < fillUiSize) {
            throw new Error(`Invalid ui height provided: ${size.height}`);
        }

        this._size = size;
    }

    /**
     * Dispose the resources this view is holding. Will be called when the view
     * is removed from the interaction state or if this view is a child of
     * another view and it is being removed from that view.
     * Any inherited classes should call super.dispose to ensure that all
     * resources are properly handled.
     */
    dispose() {
        for (const child of this._children) {
            child.dispose();
        }
        this._parent = null;
        this._uiAction.dispose();
    }

    /**
     * Visit and return all views (including self and nested).
     * @param filter optional filter to apply to children returned
     */
    getViews(filter?: (view: UIView) => boolean): UIView[] {
        const views: UIView[] = [];
        const viewsToFilter: UIView[] = [this];

        while (viewsToFilter.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const view = viewsToFilter.pop()!;

            // If there is a filter and it matches or there is no filter
            // add the view to the returned list of views
            if ((filter && filter(view)) || !filter) {
                views.push(view);
            }
            for (const child of view._children) {
                viewsToFilter.push(child);
            }
        }

        return views;
    }

    /**
     * Update the screen position of the children for this view based on their
     * offset position
     */
    updateTransform() {
        if (this.parent) {
            this._screenPosition = addPoint(
                this.parent.screenPosition,
                this._offset
            );
        } else {
            this.screenPosition = this._offset;
        }

        for (const child of this._children) {
            child.updateTransform();
        }
    }

    /**
     * Checks if the point is within the bounds of this view. Mostly used for
     * checking if a tap is considered inside this view. Does not handle the
     * hit testing, this is handled by `hitTest`.
     * @param point the point in screen space to test if is within this view
     * @returns true if within, false if not
     */
    withinViewBounds(point: Point): boolean {
        return withinRectangle(
            point,
            this.screenPosition.x,
            this.screenPosition.y,
            this.screenPosition.x + this.measuredSize.width,
            this.screenPosition.y + this.measuredSize.height
        );
    }

    /**
     * Called when a tap is registered down. Will only trigged if the
     * screenpoint is considered within this view
     * @param screenPoint the position the tap started at
     * @returns true if this tap was consumed by this view. Defaults to false
     */
    onTapDown(screenPoint: Point): boolean {
        return false;
    }
    /**
     * Called when a tap is registered as no-longer down.
     * @param screenPoint the position of this tap event
     */
    onTapUp(screenPoint: Point) {}
    /**
     * Called when a tap is registered as both up and down within this view.
     * @param screenPoint the position this event occured at.
     * @returns true if this tap was handled by the view. Defaults to false
     */
    onTap(screenPoint: Point): boolean {
        return false;
    }

    onFocus() {}
    onFocusLost() {}

    /**
     * Bubble a `UIAction` upwards to parents.
     * Will first trigger the views `uiAction` event listeners and then pass
     * on the action to any parents.
     * @param action the action to bubble upwards
     */
    bubbleAction(action: UIAction): void {
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
     */
    dispatchUIEvent(event: UIEvent): boolean {
        if (isTapEvent(event)) {
            return this.dispatchTapEvent(event);
        } else if (event.type == "direction") {
            return this.handleDirectionEvent(event);
        } else {
            console.warn("Unrecognised event type: ", event);
            //Input type was not recognised so it will not be handled
            return false;
        }
    }

    /**
     * Adds a child view to the view. Views added should not have a parent.
     * @param view the view to add
     */
    protected addView(view: UIView) {
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
     */
    protected removeView(view: UIView) {
        view.dispose();
        this._children = this._children.filter((child) => child != view);
    }

    protected clearViews() {
        for (const child of this._children) {
            child.dispose();
        }
        this._children = [];
    }

    /**
     * Test if the screen point is within the bounds of this view
     * Return false from this method will still do hit testing on
     * children. This might return true if something wants to be considered
     * opaque. Eg a background or some padding.
     * @param screenPoint
     * @returns
     */
    abstract hitTest(screenPoint: Point): boolean;
    /**
     * Requests the view to layout itself and any children
     * @param constraints the size constraints for the parent
     * @return the size of the view
     */
    abstract layout(
        layoutContext: UILayoutContext,
        constraints: UISize
    ): UISize;

    /**
     * Request to draw this view
     */
    abstract draw(context: UIRenderContext): void;

    /**
     * Dispatch a tap event to this view and its children to
     * check if its handled
     * @param event the tap event that occured
     * @returns if the event was handled
     */
    private dispatchTapEvent(event: UITapEvent): boolean {
        let handled = false;
        // check if this view is within bounds, if it its we dispatch the event
        // to children. Then run the tap events if it hit tests
        const withinBounds = this.withinViewBounds(event.position);

        // If the event is not within our bounds we do not pass it on
        if (!withinBounds) {
            return false;
        }

        // Pass it on to children, allowing the deepest child to handle the
        // event first
        for (const child of this.children) {
            const childHandledEvent = child.dispatchUIEvent(event);
            if (childHandledEvent) {
                return true;
            }
        }

        // if we get here the children did not handle the event so we check if
        // this view wants to handle it
        if (this.hitTest(event.position)) {
            switch (event.type) {
                case "tap":
                    handled = this.onTap(event.position);
                    break;
                case "tapStart":
                    handled = this.onTapDown(event.position);
                    break;
                case "tapEnd":
                    this.onTapUp(event.position);
                    break;
            }
        }

        return handled;
    }

    /**
     * Handle the input event by attempting to focus the closest
     * focusable view in the whole view hierachy of this view and its children,
     * in the direction of the event. Will change the focus of this
     * view hierachy if there is a view considered adjacent.
     * @param event the input event to handle
     * @returns true if there was a view to focus, false if not
     *
     */
    private handleDirectionEvent(event: UIInputEvent): boolean {
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
            const closestView = getClosestFocusableView(
                focusableViews,
                currentlyFocusedView,
                event.direction
            );
            if (!!closestView) {
                this.focusState.setFocus(closestView);
                return true;
            } else {
                return false;
            }
        } else {
            //No current focus exist so we pick the view closest to the top left
            const firstFocusResult =
                this.focusState.setFirstFocus(focusableViews);
            return firstFocusResult;
        }
    }
}
