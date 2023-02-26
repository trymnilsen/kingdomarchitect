import { withinRectangle } from "../../common/bounds";
import { Point } from "../../common/point";
import { UIBackground } from "../uiBackground";
import { UIBox } from "./uiBox";

export class UIButton extends UIBox {
    private _onTappedBackground: UIBackground | null = null;
    private _defaultBackground: UIBackground | null = null;
    onTapCallback: () => void = () => {};

    get onTappedBackground(): UIBackground | null {
        return this._onTappedBackground;
    }
    set onTappedBackground(background: UIBackground | null) {
        this._onTappedBackground = background;
    }

    get defaultBackground(): UIBackground | null {
        return this._defaultBackground;
    }
    set defaultBackground(background: UIBackground | null) {
        if (this.background == null) {
            this.background = background;
        }
        this._defaultBackground = background;
    }

    override get isFocusable(): boolean {
        return true;
    }

    override onTapDown(screenPoint: Point): boolean {
        if (this._onTappedBackground) {
            this.background = this._onTappedBackground;
        }

        return true;
    }

    override onTap(screenPoint: Point): boolean {
        if (this.onTapCallback) {
            try {
                this.onTapCallback();
            } catch (err) {
                console.error("Failed invoking on tap:", err);
            }
        }
        return true;
    }

    override onTapUp(screenPoint: Point) {
        this.background = this._defaultBackground;
    }

    override hitTest(screenPoint: Point): boolean {
        return withinRectangle(
            screenPoint,
            this.screenPosition.x,
            this.screenPosition.y,
            this.screenPosition.x + (this.measuredSize?.width || 0),
            this.screenPosition.y + (this.measuredSize?.height || 0)
        );
    }
}
