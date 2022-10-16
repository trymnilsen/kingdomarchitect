import { assets } from "../asset/assets";
import { Sides, zeroSides } from "../common/sides";
import { addPoint, Point, zeroPoint } from "../common/point";
import { UIRenderContext } from "../rendering/uiRenderContext";
import { UILayoutContext } from "./uiLayoutContext";
import { Bounds, withinRectangle, zeroBounds } from "../common/bounds";
import { UIEvent } from "./event/uiEvent";

export interface UISize {
    height: number;
    width: number;
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

    constructor(size: UISize) {
        if (size.width < fillUiSize) {
            throw new Error(`Invalid ui width provided: ${size.width}`);
        }
        if (size.height < fillUiSize) {
            throw new Error(`Invalid ui height provided: ${size.height}`);
        }

        this._size = size;
    }

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

    removeView(view: UIView) {
        //
    }

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

    withinViewBounds(point: Point): boolean {
        return withinRectangle(
            point,
            this.screenPosition.x,
            this.screenPosition.y,
            this.screenPosition.x + (this.measuredSize?.width || 0),
            this.screenPosition.y + (this.measuredSize?.height || 0)
        );
    }

    onTapDown(screenPoint: Point): boolean {
        return false;
    }
    onTap(screenPoint: Point): boolean {
        return false;
    }
    onTapUp(screenPoint: Point) {}

    /**
     *
     * @param event
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

    abstract draw(context: UIRenderContext): void;
}
