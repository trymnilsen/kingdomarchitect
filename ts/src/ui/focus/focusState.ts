import { sprites2 } from "../../asset/sprite";
import { allSides } from "../../common/sides";
import { RenderContext } from "../../rendering/renderContext";
import { UIView } from "../uiView";

export class FocusState {
    private _currentFocus: UIView | null = null;

    get currentFocus(): UIView | null {
        return this._currentFocus;
    }

    setFocus(view: UIView) {
        if (!!this._currentFocus) {
            this._currentFocus.onFocusLost();
        }
        this._currentFocus = view;
        view.onFocus();
    }

    /**
     * Set the focus to the first item
     * @param ofView
     */
    setFirstFocus(views: UIView[]): boolean {
        if (views.length == 0) {
            return false;
        } else {
            this.setFocus(views[0]);
            return true;
        }
    }

    onDraw(context: RenderContext): void {
        if (!!this._currentFocus) {
            const postition = this._currentFocus.screenPosition;
            const size = this._currentFocus.measuredSize;
            if (!!size) {
                context.drawScreenSpaceRectangle({
                    fill: "blue",
                    width: size.width,
                    height: size.height,
                    x: postition.x,
                    y: postition.y,
                });
                /*
                context.drawNinePatchSprite({
                    sprite: sprites2.cursor,
                    height: size.height,
                    width: size.width,
                    scale: 1.0,
                    sides: allSides(12.0),
                    x: postition.x,
                    y: postition.y,
                });*/
            }
        }
    }
}
