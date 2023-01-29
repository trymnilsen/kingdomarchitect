import { Point } from "../../common/point";
import { UIRenderContext } from "../../rendering/uiRenderContext";
import { UIBackground } from "../uiBackground";
import { UILayoutContext } from "../uiLayoutContext";
import { UISize, UIView } from "../uiView";

export class UIMasterDetails extends UIView {
    private _singleBackground: UIBackground | null = null;
    private _dualBackground: UIBackground | null = null;
    private _mode: UIMasterDetailsMode = UIMasterDetailsMode.Dual;
    private _focusedMode: UIMasterDetailFocusedMode =
        UIMasterDetailFocusedMode.Master;

    get singleBackground(): UIBackground | null {
        return this._singleBackground;
    }
    set singleBackground(background: UIBackground | null) {
        this._singleBackground = background;
    }

    get dualBackground(): UIBackground | null {
        return this._dualBackground;
    }
    set dualBackground(background: UIBackground | null) {
        this._dualBackground = background;
    }

    get background(): UIBackground | null {
        switch (this._mode) {
            case UIMasterDetailsMode.Single:
                return this._singleBackground;
            case UIMasterDetailsMode.Dual:
                return this._dualBackground;
        }
    }

    constructor(
        private masterView: UIView,
        private detailsView: UIView,
        size: UISize
    ) {
        super(size);
    }

    /**
     * Shows the given view as the details part of this view
     * Depending on layout space it might be placed next to the
     * master list or on to as its own on top of the master if there
     * is limited space.
     * @param view
     */
    showDetails(view: UIView) {
        this.detailsView = view;
    }

    hitTest(screenPoint: Point): boolean {
        return !!this.background;
    }
    layout(layoutContext: UILayoutContext, constraints: UISize): UISize {
        const measuredSize: UISize = {
            width: 600,
            height: 400,
        };

        this._measuredSize = measuredSize;
        return measuredSize;
    }
    draw(context: UIRenderContext): void {
        if (this.measuredSize) {
            this._dualBackground?.draw(
                context,
                this.screenPosition,
                this.measuredSize
            );
        }
    }
}

enum UIMasterDetailFocusedMode {
    Master,
    Details,
}

enum UIMasterDetailsMode {
    Single,
    Dual,
}
