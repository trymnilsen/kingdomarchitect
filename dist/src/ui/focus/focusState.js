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
import { manhattanDistance } from "../../common/point.js";
export class FocusState {
    get currentFocus() {
        return this._currentFocus;
    }
    setFocus(view) {
        if (!!this._currentFocus) {
            this._currentFocus.onFocusLost();
        }
        this._currentFocus = view;
        view.onFocus();
    }
    /**
     * Set the focus to the first item
     * @param ofView
     */ setFirstFocus(views) {
        if (views.length == 0) {
            return false;
        } else {
            let closestDistance = Number.MAX_SAFE_INTEGER;
            let closestView = views[0];
            for (const view of views){
                const viewDistance = manhattanDistance({
                    x: 0,
                    y: 0
                }, view.screenPosition);
                if (viewDistance < closestDistance) {
                    closestDistance = viewDistance;
                    closestView = view;
                }
            }
            this.setFocus(closestView);
            return true;
        }
    }
    constructor(){
        _define_property(this, "_currentFocus", null);
    }
}
