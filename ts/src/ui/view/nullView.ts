import { UISize } from "../uiSize.js";
import { UIView } from "../uiView.js";

/**
 * A view that does nothing. It has zero height and width and
 * does not draw anything. Can be used as a placeholder view to avoid
 * needing nullable view references
 */
export class NullView extends UIView {
    constructor() {
        super({
            width: 0,
            height: 0,
        });
    }
    override hitTest(): boolean {
        return false;
    }
    override layout(): UISize {
        const size: UISize = {
            width: 0,
            height: 0,
        };

        this._measuredSize = size;
        return size;
    }
    override draw(): void {
        // No-op, we dont draw anything
    }
}
