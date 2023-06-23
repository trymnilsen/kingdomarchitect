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
import { sprites2 } from "../../../asset/sprite.js";
import { addPoint } from "../../../common/point.js";
import { allSides } from "../../../common/sides.js";
import { ninePatchBackground } from "../../../ui/dsl/uiBackgroundDsl.js";
import { uiButton } from "../../../ui/dsl/uiButtonDsl.js";
import { uiColumn } from "../../../ui/dsl/uiColumnDsl.js";
import { spriteImageSource, uiImage } from "../../../ui/dsl/uiImageDsl.js";
import { uiSpace } from "../../../ui/dsl/uiSpaceDsl.js";
import { HorizontalAlignment, uiAlignment } from "../../../ui/uiAlignment.js";
import { wrapUiSize, zeroSize } from "../../../ui/uiSize.js";
import { UIView } from "../../../ui/uiView.js";
import { NullView } from "../../../ui/view/nullView.js";
import { OpenBookUIBackground } from "../../../ui/visual/bookBackground.js";
export class UIBookLayout extends UIView {
    get leftPage() {
        return this._leftPage;
    }
    set leftPage(leftPage) {
        this.removeView(this._leftPage);
        this._leftPage = leftPage;
        this.addView(this._leftPage);
    }
    get rightPage() {
        return this._rightPage;
    }
    set rightPage(rightPage) {
        this.removeView(this._rightPage);
        this._rightPage = rightPage;
        this.addView(this._rightPage);
    }
    setTabs(tabs) {
        if (this._tabsView) {
            this.removeView(this._tabsView);
        }
        const tabViews = tabs.flatMap((tab, index)=>{
            const tabButton = uiButton({
                width: tab.isSelected ? 64 : 48,
                height: 48,
                padding: {
                    left: 8,
                    right: 0,
                    top: 0,
                    bottom: 0
                },
                alignment: uiAlignment.centerLeft,
                onTapCallback: ()=>{
                    console.log("Tab tapped: ", index);
                    tab.onTap(index);
                },
                children: [
                    uiImage({
                        width: 32,
                        height: 32,
                        image: spriteImageSource(tab.icon)
                    })
                ],
                defaultBackground: ninePatchBackground({
                    sprite: sprites2.book_tab,
                    scale: 1,
                    sides: allSides(8)
                })
            });
            const views = [];
            views.push(tabButton);
            if (index < tabs.length - 1) {
                views.push(uiSpace({
                    width: 0,
                    height: 8
                }));
            }
            return views;
        }).map((view)=>{
            return {
                child: view
            };
        });
        const tabContainer = uiColumn({
            width: wrapUiSize,
            height: wrapUiSize,
            children: tabViews,
            horizontalAlignment: HorizontalAlignment.Right
        });
        this._tabsView = tabContainer;
        this.addView(tabContainer);
    }
    hitTest(screenPoint) {
        return false;
    }
    layout(layoutContext, constraints) {
        const availableSize = {
            width: constraints.width - horizontalPadding * 2,
            height: constraints.height - verticalPadding * 2
        };
        // If the size available is less than the dual page size we switch
        // to single page mode
        if (availableSize.width < dualPageSize) {
            this._mode = UIBookLayoutMode.Single;
        } else {
            this._mode = UIBookLayoutMode.Dual;
        }
        let bookOffset = 0;
        let bookWidth = bookSize.width;
        if (this._mode == UIBookLayoutMode.Single) {
            bookWidth = pageWidth;
            if (this._currentPage == UIBookLayoutPage.Left) {
                bookOffset = 0;
            } else {
                bookOffset = pageWidth;
            }
        }
        const pageConstraints = {
            width: pageWidth,
            height: pageHeight
        };
        this._leftPage.layout(layoutContext, pageConstraints);
        this._rightPage.layout(layoutContext, pageConstraints);
        // Position the views
        this._leftPage.offset = {
            x: horizontalPadding + bookOffset,
            y: verticalPadding
        };
        this._rightPage.offset = {
            x: pageWidth + horizontalPadding + bookOffset,
            y: verticalPadding
        };
        if (this._tabsView) {
            this._tabsView.layout(layoutContext, pageConstraints);
            this._tabsView.offset = {
                x: 0,
                y: 60
            };
        }
        const size = {
            width: bookWidth + horizontalPadding * 2,
            height: pageHeight + verticalPadding * 2
        };
        this._measuredSize = size;
        return size;
    }
    draw(context) {
        if (!this._measuredSize) {
            throw new Error("Measured size is not set, cannot draw");
        }
        const backgroundPosition = addPoint({
            x: horizontalPadding,
            y: verticalPadding
        }, this.screenPosition);
        bookBackground.draw(context, backgroundPosition, bookSize);
        this._leftPage.draw(context);
        this._rightPage.draw(context);
        if (this._tabsView) {
            this._tabsView.draw(context);
        }
    }
    constructor(){
        super({
            width: wrapUiSize,
            height: wrapUiSize
        });
        _define_property(this, "_leftPage", new NullView());
        _define_property(this, "_rightPage", new NullView());
        _define_property(this, "_mode", UIBookLayoutMode.Dual);
        _define_property(this, "_currentPage", UIBookLayoutPage.Left);
        /**
     * The view that keeps the tabs, is null if no tabs are set
     */ _define_property(this, "_tabsView", null);
        /**
     * Size of the area that is filled with the book background
     * The view stretches a bit beyond this to make room for the tabs
     * so we keep track of what is the "percieved" size of the view/background
     */ _define_property(this, "_sizeWithoutPadding", zeroSize());
    }
}
export var UIBookLayoutMode;
(function(UIBookLayoutMode) {
    UIBookLayoutMode[UIBookLayoutMode["Single"] = 0] = "Single";
    UIBookLayoutMode[UIBookLayoutMode["Dual"] = 1] = "Dual";
})(UIBookLayoutMode || (UIBookLayoutMode = {}));
export var UIBookLayoutPage;
(function(UIBookLayoutPage) {
    UIBookLayoutPage[UIBookLayoutPage["Left"] = 0] = "Left";
    UIBookLayoutPage[UIBookLayoutPage["Right"] = 1] = "Right";
})(UIBookLayoutPage || (UIBookLayoutPage = {}));
const pageWidth = 300;
const pageHeight = 500;
const dualPageSize = pageWidth * 2;
const bookSize = {
    width: pageWidth * 2,
    height: pageHeight
};
const horizontalPadding = 44;
const verticalPadding = 32;
const bookBackground = new OpenBookUIBackground();
