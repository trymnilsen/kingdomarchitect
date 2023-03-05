import { sprites2 } from "../../asset/sprite";
import { manhattanDistance } from "../../common/point";
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
            let closestDistance = Number.MAX_SAFE_INTEGER;
            let closestView = views[0];
            for (const view of views) {
                const viewDistance = manhattanDistance(
                    { x: 0, y: 0 },
                    view.screenPosition
                );
                if (viewDistance < closestDistance) {
                    closestDistance = viewDistance;
                    closestView = view;
                }
            }
            this.setFocus(closestView);
            return true;
        }
    }
}
