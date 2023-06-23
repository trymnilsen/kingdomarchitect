import { UIView } from "./uiView.js";
/**
 * UIViewGroup is an extension of UIView that makes
 * the addView and removeView methods public for using in dynamic layout
 * classes like UIRow, UIColumn and UIBox. Views that allow adding and
 * removing views should extend this to avoid having to override the
 * addView and removeView methods itself.
 */ export class UIViewGroup extends UIView {
    addView(view) {
        super.addView(view);
    }
    removeView(view) {
        super.removeView(view);
    }
    clearViews() {
        super.clearViews();
    }
}
