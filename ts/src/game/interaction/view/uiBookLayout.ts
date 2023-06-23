import { Sprite2, sprites2 } from "../../../asset/sprite.js";
import { Point, addPoint } from "../../../common/point.js";
import { allSides } from "../../../common/sides.js";
import { UIRenderContext } from "../../../rendering/uiRenderContext.js";
import { ninePatchBackground } from "../../../ui/dsl/uiBackgroundDsl.js";
import { uiButton } from "../../../ui/dsl/uiButtonDsl.js";
import { ColumnChild, uiColumn } from "../../../ui/dsl/uiColumnDsl.js";
import { spriteImageSource, uiImage } from "../../../ui/dsl/uiImageDsl.js";
import { uiSpace } from "../../../ui/dsl/uiSpaceDsl.js";
import { HorizontalAlignment, uiAlignment } from "../../../ui/uiAlignment.js";
import { UILayoutContext } from "../../../ui/uiLayoutContext.js";
import { UISize, wrapUiSize, zeroSize } from "../../../ui/uiSize.js";
import { UIView } from "../../../ui/uiView.js";
import { NullView } from "../../../ui/view/nullView.js";
import { UIColumn } from "../../../ui/view/uiColumn.js";
import { OpenBookUIBackground } from "../../../ui/visual/bookBackground.js";

export class UIBookLayout extends UIView {
    private _leftPage: UIView = new NullView();
    private _rightPage: UIView = new NullView();
    private _mode: UIBookLayoutMode = UIBookLayoutMode.Dual;
    private _currentPage: UIBookLayoutPage = UIBookLayoutPage.Left;
    /**
     * The view that keeps the tabs, is null if no tabs are set
     */
    private _tabsView: UIColumn | null = null;
    /**
     * Size of the area that is filled with the book background
     * The view stretches a bit beyond this to make room for the tabs
     * so we keep track of what is the "percieved" size of the view/background
     */
    private _sizeWithoutPadding: UISize = zeroSize();

    constructor() {
        super({
            width: wrapUiSize,
            height: wrapUiSize,
        });
    }

    get leftPage(): UIView {
        return this._leftPage;
    }
    set leftPage(leftPage: UIView) {
        this.removeView(this._leftPage);
        this._leftPage = leftPage;
        this.addView(this._leftPage);
    }

    get rightPage(): UIView {
        return this._rightPage;
    }
    set rightPage(rightPage: UIView) {
        this.removeView(this._rightPage);
        this._rightPage = rightPage;
        this.addView(this._rightPage);
    }

    setTabs(tabs: UIBookLayoutTab[]) {
        if (this._tabsView) {
            this.removeView(this._tabsView);
        }

        const tabViews = tabs
            .flatMap((tab, index) => {
                const tabButton = uiButton({
                    width: tab.isSelected ? 64 : 48,
                    height: 48,
                    padding: {
                        left: 8,
                        right: 0,
                        top: 0,
                        bottom: 0,
                    },
                    alignment: uiAlignment.centerLeft,
                    onTapCallback: () => {
                        console.log("Tab tapped: ", index);
                        tab.onTap(index);
                    },
                    children: [
                        uiImage({
                            width: 32,
                            height: 32,
                            image: spriteImageSource(tab.icon),
                        }),
                    ],
                    defaultBackground: ninePatchBackground({
                        sprite: sprites2.book_tab,
                        scale: 1,
                        sides: allSides(8),
                    }),
                });

                const views: UIView[] = [];
                views.push(tabButton);

                if (index < tabs.length - 1) {
                    views.push(uiSpace({ width: 0, height: 8 }));
                }
                return views;
            })
            .map<ColumnChild>((view) => {
                return {
                    child: view,
                };
            });

        const tabContainer = uiColumn({
            width: wrapUiSize,
            height: wrapUiSize,
            children: tabViews,
            horizontalAlignment: HorizontalAlignment.Right,
        });

        this._tabsView = tabContainer;
        this.addView(tabContainer);
    }

    override hitTest(screenPoint: Point): boolean {
        return false;
    }

    override layout(
        layoutContext: UILayoutContext,
        constraints: UISize
    ): UISize {
        const availableSize = {
            width: constraints.width - horizontalPadding * 2,
            height: constraints.height - verticalPadding * 2,
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

        const pageConstraints: UISize = {
            width: pageWidth,
            height: pageHeight,
        };

        this._leftPage.layout(layoutContext, pageConstraints);
        this._rightPage.layout(layoutContext, pageConstraints);

        // Position the views
        this._leftPage.offset = {
            x: horizontalPadding + bookOffset,
            y: verticalPadding,
        };

        this._rightPage.offset = {
            x: pageWidth + horizontalPadding + bookOffset,
            y: verticalPadding,
        };

        if (this._tabsView) {
            this._tabsView.layout(layoutContext, pageConstraints);
            this._tabsView.offset = {
                x: 0,
                y: 60,
            };
        }

        const size: UISize = {
            width: bookWidth + horizontalPadding * 2,
            height: pageHeight + verticalPadding * 2,
        };
        this._measuredSize = size;
        return size;
    }

    override draw(context: UIRenderContext): void {
        if (!this._measuredSize) {
            throw new Error("Measured size is not set, cannot draw");
        }

        const backgroundPosition = addPoint(
            {
                x: horizontalPadding,
                y: verticalPadding,
            },
            this.screenPosition
        );

        bookBackground.draw(context, backgroundPosition, bookSize);

        this._leftPage.draw(context);
        this._rightPage.draw(context);

        if (this._tabsView) {
            this._tabsView.draw(context);
        }
    }
}

export enum UIBookLayoutMode {
    Single,
    Dual,
}

export enum UIBookLayoutPage {
    Left,
    Right,
}

export interface UIBookLayoutTab {
    icon: Sprite2;
    onTap: (index: number) => void;
    isSelected: boolean;
}

const pageWidth = 300;
const pageHeight = 500;
const dualPageSize = pageWidth * 2;
const bookSize: UISize = {
    width: pageWidth * 2,
    height: pageHeight,
};
const horizontalPadding = 44;
const verticalPadding = 32;
const bookBackground = new OpenBookUIBackground();
