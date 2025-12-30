import { manhattanDistance } from "../../common/point.ts";
import { FocusNode } from "./focusHelpers.ts";

export class FocusState {
    private _currentFocus: FocusNode | null = null;

    get currentFocus(): FocusNode | null {
        return this._currentFocus;
    }

    setFocus(view: FocusNode) {
        if (this._currentFocus) {
            this._currentFocus.onFocusLost();
        }
        this._currentFocus = view;
        view.onFocus();
    }

    /**
     * Set the focus to the first item
     * @param ofView
     */
    setFirstFocus(views: FocusNode[]): boolean {
        if (views.length == 0) {
            return false;
        } else {
            let closestDistance = Number.MAX_SAFE_INTEGER;
            let closestView = views[0];
            for (const view of views) {
                const viewDistance = manhattanDistance(
                    { x: 0, y: 0 },
                    { x: view.bounds.x1, y: view.bounds.y1 },
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
