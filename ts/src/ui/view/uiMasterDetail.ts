import { addPoint, Point } from "../../common/point";
import { UIRenderContext } from "../../rendering/uiRenderContext";
import { UIBackground } from "../uiBackground";
import { UILayoutContext } from "../uiLayoutContext";
import { UISize } from "../uiSize";
import { UIView } from "../uiView";

export class UIMasterDetails extends UIView {
    private _singleBackground: UIBackground | null = null;
    private _dualBackground: UIBackground | null = null;
    private _mode: UIMasterDetailsMode = UIMasterDetailsMode.Dual;
    private _focusedMode: UIMasterDetailFocusedMode =
        UIMasterDetailFocusedMode.Master;
    private inventoryOffset;
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
        this.addView(masterView);
        this.addView(detailsView);
    }

    /**
     * Shows the given view as the details part of this view
     * Depending on layout space it might be placed next to the
     * master list or on to as its own on top of the master if there
     * is limited space.
     * @param view
     */
    showDetails(view: UIView) {
        this.removeView(this.detailsView);
        this.detailsView = view;
        this._focusedMode = UIMasterDetailFocusedMode.Details;
        this.addView(view);
    }

    hitTest(screenPoint: Point): boolean {
        return !!this.background;
    }

    override onTap(screenPoint: Point): boolean {
        return !!this.background;
    }

    layout(layoutContext: UILayoutContext, constraints: UISize): UISize {
        if (constraints.width < 600) {
            this._mode = UIMasterDetailsMode.Single;
            const measuredSize: UISize = {
                width: 300,
                height: 400,
            };

            this.masterView.layout(layoutContext, { width: 300, height: 400 });
            this.detailsView.layout(layoutContext, { width: 300, height: 400 });
            if (this._focusedMode == UIMasterDetailFocusedMode.Master) {
                this.detailsView.offset = { x: 300, y: 0 };
                this.masterView.offset = { x: 0, y: 0 };
            } else {
                this.detailsView.offset = { x: 0, y: 0 };
                this.masterView.offset = { x: -300, y: 0 };
            }

            this._measuredSize = measuredSize;
            return measuredSize;
        } else {
            const measuredSize: UISize = {
                width: 600,
                height: 400,
            };
            this._mode = UIMasterDetailsMode.Dual;
            this.masterView.layout(layoutContext, { width: 300, height: 400 });
            this.detailsView.layout(layoutContext, { width: 300, height: 400 });
            this.detailsView.offset = { x: 300, y: 0 };
            this._measuredSize = measuredSize;
            return measuredSize;
        }
    }

    draw(context: UIRenderContext): void {
        if (this.isLayedOut) {
            let backgroundOffset = { x: 0, y: 0 };
            if (
                this._mode == UIMasterDetailsMode.Single &&
                this._focusedMode == UIMasterDetailFocusedMode.Details
            ) {
                backgroundOffset = {
                    x: -300,
                    y: 0,
                };
            }
            this._dualBackground?.draw(
                context,
                addPoint(this.screenPosition, backgroundOffset),
                {
                    width: 600,
                    height: 400,
                }
            );
        }
        this.masterView.draw(context);
        this.detailsView.draw(context);
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
