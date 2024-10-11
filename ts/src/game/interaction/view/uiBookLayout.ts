import { Sprite2, sprites2 } from "../../../asset/sprite.js";
import { Point, addPoint } from "../../../common/point.js";
import { allSides } from "../../../common/sides.js";
import { uiDebug } from "../../../constants.js";
import { UIRenderScope } from "../../../rendering/uiRenderContext.js";
import { ninePatchBackground } from "../../../ui/dsl/uiBackgroundDsl.js";
import { uiButton } from "../../../ui/dsl/uiButtonDsl.js";
import { ColumnChild, uiColumn } from "../../../ui/dsl/uiColumnDsl.js";
import { spriteImageSource, uiImage } from "../../../ui/dsl/uiImageDsl.js";
import { uiSpace } from "../../../ui/dsl/uiSpaceDsl.js";
import { HorizontalAlignment, uiAlignment } from "../../../ui/uiAlignment.js";
import { UILayoutScope } from "../../../ui/uiLayoutContext.js";
import { UISize, wrapUiSize, zeroSize } from "../../../ui/uiSize.js";
import { UIView } from "../../../ui/uiView.js";
import { NullView } from "../../../ui/view/nullView.js";
import { UIColumn } from "../../../ui/view/uiColumn.js";
import { OpenBookUIBackground } from "../../../ui/visual/bookBackground.js";
/**
 * Create a view that has two sections, a left and right page (sometimes
 * referred to as the details page). Optional tabs can be added on the left
 * edge of the left page. The View is styled to look like a pixelated book.
 * To keep the view functional on smaller width screens the view will handle
 * only showing a single page (left or right) at a time if needed to fit the
 * users screen.
 */
export class UIBookLayout extends UIView {
    private _leftPage: UIView = new NullView();
    private _rightPage: UIView = new NullView();
    private _mode: UIBookLayoutMode = UIBookLayoutMode.Dual;
    private _currentPage: UIBookLayoutPage = UIBookLayoutPage.Left;
    private _bookOffset = 0;
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

    get currentPage(): UIBookLayoutPage {
        return this._currentPage;
    }
    /**
     * Hint at which page is the active page
     * In single page mode this will be the visible page
     */
    set currentPage(page: UIBookLayoutPage) {
        this._currentPage = page;
    }

    /**
     * Set the tabs added on the left side of the left page. Will remove
     * any current tabs.
     * @param tabs The tabs to add
     */
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

    override hitTest(): boolean {
        return false;
    }

    override layout(layoutContext: UILayoutScope, constraints: UISize): UISize {
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

        let bookWidth = bookSize.width;

        if (this._mode == UIBookLayoutMode.Single) {
            bookWidth = pageWidth;
            if (this._currentPage == UIBookLayoutPage.Left) {
                this._bookOffset = 0;
            } else {
                this._bookOffset = pageWidth * -1;
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
            x: horizontalPadding + this._bookOffset,
            y: verticalPadding,
        };

        this._rightPage.offset = {
            x: pageWidth + horizontalPadding + this._bookOffset,
            y: verticalPadding,
        };

        if (this._tabsView) {
            this._tabsView.layout(layoutContext, pageConstraints);
            this._tabsView.offset = {
                x: this._bookOffset,
                y: 60,
            };
        }

        let usedHorizontalPadding = horizontalPadding * 2;
        if (bookWidth + usedHorizontalPadding > constraints.width) {
            usedHorizontalPadding = horizontalPadding;
        }

        const size: UISize = {
            width: bookWidth + usedHorizontalPadding,
            height: pageHeight + verticalPadding * 2,
        };

        this._measuredSize = size;
        return size;
    }

    override draw(context: UIRenderScope): void {
        if (!this._measuredSize) {
            throw new Error("Measured size is not set, cannot draw");
        }

        const backgroundPosition = addPoint(
            {
                x: horizontalPadding + this._bookOffset,
                y: verticalPadding,
            },
            this.screenPosition,
        );

        bookBackground.draw(context, backgroundPosition, bookSize);

        if (uiDebug()) {
            context.drawScreenSpaceRectangle({
                x: this.screenPosition.x,
                y: this.screenPosition.y,
                width: this._measuredSize.width,
                height: this._measuredSize.height,
                fill: "rgba(0,0,255,0.5)",
            });

            context.drawScreenSpaceRectangle({
                x: this._leftPage.screenPosition.x,
                y: this._leftPage.screenPosition.y,
                width: this._leftPage.measuredSize.width,
                height: this._leftPage.measuredSize.height,
                fill: "rgba(255,255,0,0.5)",
            });

            context.drawScreenSpaceRectangle({
                x: this._rightPage.screenPosition.x,
                y: this._rightPage.screenPosition.y,
                width: this._rightPage.measuredSize.width,
                height: this._rightPage.measuredSize.height,
                fill: "rgba(255,0,255,0.5)",
            });
        }

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

export type UIBookLayoutTab = {
    icon: Sprite2;
    onTap: (index: number) => void;
    isSelected: boolean;
};

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
