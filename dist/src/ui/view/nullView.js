import { UIView } from "../uiView.js";
/**
 * A view that does nothing. It has zero height and width and
 * does not draw anything. Can be used as a placeholder view to avoid
 * needing nullable view references
 */ export class NullView extends UIView {
    hitTest(screenPoint) {
        return false;
    }
    layout(layoutContext, constraints) {
        const size = {
            width: 0,
            height: 0
        };
        this._measuredSize = size;
        return size;
    }
    draw(context) {
    // No-op, we dont draw anything
    }
    constructor(){
        super({
            width: 0,
            height: 0
        });
    }
}
