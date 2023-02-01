import { withinRectangle } from "../common/bounds";
import { Event, EventListener } from "../common/event";
import { addPoint, Point, zeroPoint } from "../common/point";
import { Sides, zeroSides } from "../common/sides";
import { UIRenderContext } from "../rendering/uiRenderContext";
import { UIEvent } from "./event/uiEvent";
import { UILayoutContext } from "./uiLayoutContext";
import { UISize } from "./uiSize";

export interface UIAction {
    type: string;
    data: unknown;
}

export const wrapUiSize = -1;
export const fillUiSize = -2;

export abstract class UIView {
    private _parent: UIView | null = null;
    private _screenPosition: Point = zeroPoint();
    private _offset: Point = zeroPoint();
    private _padding: Sides = zeroSides();
    private _size: UISize;
    private _id: string | null = null;
    private _children: UIView[] = [];
    private _uiAction: Event<UIAction> = new Event();
    protected _measuredSize: UISize | null = null;
    protected _isDirty: boolean = true;

    get padding(): Sides {
        return this._padding;
    }
    set padding(value: Sides) {
        this._padding = value;
    }

    get offset(): Point {
        return this._offset;
    }
    set offset(value: Point) {
        this._offset = value;
    }

    get size(): UISize {
        return this._size;
    }
    set size(size: UISize) {
        this._size = size;
    }

    get id(): string | null {
        return this._id;
    }
    set id(id: string | null) {
        this._id = id;
    }

    get parent(): UIView | null {
        return this._parent;
    }
    set parent(parent: UIView | null) {
        this._parent = parent;
    }

    get screenPosition(): Point {
        return this._screenPosition;
    }
    set screenPosition(position: Point) {
        this._screenPosition = position;
    }

    get measuredSize(): UISize | null {
        return this._measuredSize;
    }
    get children(): UIView[] {
        return this._children;
    }
    get isDirty(): boolean {
        return this._isDirty;
    }
    get uiAction(): EventListener<UIAction> {
        return this._uiAction;
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
        this._uiAction.dispose();
    }

    /**
     * Adds a child view to the view. Views added should not have a parent.
     * @param view the view to add
     */
    addView(view: UIView) {
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
    removeView(view: UIView) {
        //
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
            this.screenPosition.x + (this.measuredSize?.width || 0),
            this.screenPosition.y + (this.measuredSize?.height || 0)
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
}
