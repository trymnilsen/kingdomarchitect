import { UIView } from "./uiView";

/**
 * UIViewGroup is an extension of UIView that makes
 * the addView and removeView methods public for using in dynamic layout
 * classes like UIRow, UIColumn and UIBox. Views that allow adding and
 * removing views should extend this to avoid having to override the
 * addView and removeView methods itself.
 */
export abstract class UIViewGroup extends UIView {
    public override addView(view: UIView) {
        super.addView(view);
    }

    public override removeView(view: UIView) {
        super.removeView(view);
    }

    public override clearViews(): void {
        super.clearViews();
    }
}
