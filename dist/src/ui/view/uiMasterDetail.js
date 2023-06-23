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
import { addPoint } from "../../common/point.js";
import { UIView } from "../uiView.js";
export class UIMasterDetails extends UIView {
    get singleBackground() {
        return this._singleBackground;
    }
    set singleBackground(background) {
        this._singleBackground = background;
    }
    get dualBackground() {
        return this._dualBackground;
    }
    set dualBackground(background) {
        this._dualBackground = background;
    }
    get background() {
        switch(this._mode){
            case UIMasterDetailsMode.Single:
                return this._singleBackground;
            case UIMasterDetailsMode.Dual:
                return this._dualBackground;
        }
    }
    /**
     * Shows the given view as the details part of this view
     * Depending on layout space it might be placed next to the
     * master list or on to as its own on top of the master if there
     * is limited space.
     * @param view
     */ showDetails(view) {
        this.removeView(this.detailsView);
        this.detailsView = view;
        this._focusedMode = UIMasterDetailFocusedMode.Details;
        this.addView(view);
    }
    hitTest(screenPoint) {
        return !!this.background;
    }
    onTap(screenPoint) {
        return !!this.background;
    }
    layout(layoutContext, constraints) {
        if (constraints.width < 600) {
            this._mode = UIMasterDetailsMode.Single;
            const measuredSize = {
                width: 300,
                height: 400
            };
            this.masterView.layout(layoutContext, {
                width: 300,
                height: 400
            });
            this.detailsView.layout(layoutContext, {
                width: 300,
                height: 400
            });
            if (this._focusedMode == UIMasterDetailFocusedMode.Master) {
                this.detailsView.offset = {
                    x: 300,
                    y: 0
                };
                this.masterView.offset = {
                    x: 0,
                    y: 0
                };
            } else {
                this.detailsView.offset = {
                    x: 0,
                    y: 0
                };
                this.masterView.offset = {
                    x: -300,
                    y: 0
                };
            }
            this._measuredSize = measuredSize;
            return measuredSize;
        } else {
            const measuredSize = {
                width: 600,
                height: 400
            };
            this._mode = UIMasterDetailsMode.Dual;
            this.masterView.layout(layoutContext, {
                width: 300,
                height: 400
            });
            this.detailsView.layout(layoutContext, {
                width: 300,
                height: 400
            });
            this.detailsView.offset = {
                x: 300,
                y: 0
            };
            this._measuredSize = measuredSize;
            return measuredSize;
        }
    }
    draw(context) {
        if (this.isLayedOut) {
            let backgroundOffset = {
                x: 0,
                y: 0
            };
            if (this._mode == UIMasterDetailsMode.Single && this._focusedMode == UIMasterDetailFocusedMode.Details) {
                backgroundOffset = {
                    x: -300,
                    y: 0
                };
            }
            this._dualBackground?.draw(context, addPoint(this.screenPosition, backgroundOffset), {
                width: 600,
                height: 400
            });
        }
        this.masterView.draw(context);
        this.detailsView.draw(context);
    }
    constructor(masterView, detailsView, size){
        super(size);
        _define_property(this, "masterView", void 0);
        _define_property(this, "detailsView", void 0);
        _define_property(this, "_singleBackground", void 0);
        _define_property(this, "_dualBackground", void 0);
        _define_property(this, "_mode", void 0);
        _define_property(this, "_focusedMode", void 0);
        _define_property(this, "inventoryOffset", void 0);
        this.masterView = masterView;
        this.detailsView = detailsView;
        this._singleBackground = null;
        this._dualBackground = null;
        this._mode = UIMasterDetailsMode.Dual;
        this._focusedMode = UIMasterDetailFocusedMode.Master;
        this.addView(masterView);
        this.addView(detailsView);
    }
}
var UIMasterDetailFocusedMode;
(function(UIMasterDetailFocusedMode) {
    UIMasterDetailFocusedMode[UIMasterDetailFocusedMode["Master"] = 0] = "Master";
    UIMasterDetailFocusedMode[UIMasterDetailFocusedMode["Details"] = 1] = "Details";
})(UIMasterDetailFocusedMode || (UIMasterDetailFocusedMode = {}));
var UIMasterDetailsMode;
(function(UIMasterDetailsMode) {
    UIMasterDetailsMode[UIMasterDetailsMode["Single"] = 0] = "Single";
    UIMasterDetailsMode[UIMasterDetailsMode["Dual"] = 1] = "Dual";
})(UIMasterDetailsMode || (UIMasterDetailsMode = {}));
