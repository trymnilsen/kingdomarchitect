import { assets } from "../asset/assets";
import { Sides } from "../common/sides";
import { Point, zeroPoint } from "../common/point";
import { UIRenderContext } from "../rendering/uiRenderContext";

export interface UISize {
    height: number;
    width: number;
}

export const wrapUiSize = -1;
export const fillUiSize = -2;

export interface UIBackground {
    draw(context: UIRenderContext, screenPosition: Point, size: UISize): void;
}

export class NinePatchBackground implements UIBackground {
    constructor(
        private asset: keyof typeof assets,
        private sides: Sides,
        private scale: number
    ) {}
    draw(context: UIRenderContext, screenPosition: Point, size: UISize): void {
        context.drawNinePatchImage({
            x: screenPosition.x,
            y: screenPosition.y,
            width: size.width,
            height: size.height,
            asset: this.asset,
            scale: this.scale,
            sides: this.sides,
        });
    }
}

export abstract class UIView {
    private _parent: UIView | null = null;
    private _screenPosition: Point = zeroPoint;
    private _offset: Point = zeroPoint;
    private _size: UISize;
    private _children: UIView[] = [];
    protected _measuredSize: UISize | null = null;
    protected _isDirty: boolean = true;

    get size(): UISize {
        return this._size;
    }
    set size(size: UISize) {
        this._size = size;
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

    removeView(view: UIView) {}

    /**
     * Requests the view to layout itself and any children
     * @param constraints the size constraints for the parent
     * @return the size of the view
     */
    abstract layout(constraints: UISize): UISize;
    abstract draw(context: UIRenderContext): void;
}
