import { sprites2 } from "../../../../asset/sprite";
import { Point } from "../../../../common/point";
import { Sides, allSides } from "../../../../common/sides";
import { UIRenderContext } from "../../../../rendering/uiRenderContext";
import { SpriteBackground } from "../../../../ui/uiBackground";
import { UILayoutContext } from "../../../../ui/uiLayoutContext";
import { UISize, wrapUiSize } from "../../../../ui/uiSize";
import { UIView } from "../../../../ui/uiView";
import { UIColumn } from "../../../../ui/view/uiColumn";
import {
    UIActionbar,
    UIActionbarAlignment,
    UIActionbarItem,
} from "./uiActionbar";
import { UIActionbarButton } from "./uiActionbarButton";
import { actionbarHeight } from "./uiActionbarConstants";

const background = new SpriteBackground(sprites2.stone_slate_background_2x);

export class UIActionbarScaffold extends UIView {
    private _sides: Sides = allSides(16);
    private _leftActionbar: UIActionbar;
    private _rightActionbar: UIActionbar;
    private _leftExpandedMenuIndex: number = 0;
    private _rightExpandedMenuIndex: number = 0;
    private _leftExpandedMenuColumn: UIColumn;
    private _rightExpandedMenuColumn: UIColumn;
    private _leftExpandedMenu: UIActionbarItem[] = [];
    private _rightExpandedMenu: UIActionbarItem[] = [];

    public get isExpanded(): boolean {
        return (
            this._leftExpandedMenu.length > 0 ||
            this._rightExpandedMenu.length > 0
        );
    }

    public get sides(): Sides {
        return this._sides;
    }

    public set sides(value: Sides) {
        this._sides = value;
    }

    constructor(
        private contentView: UIView,
        private leftItems: UIActionbarItem[],
        private rightItems: UIActionbarItem[],
        size: UISize
    ) {
        super(size);
        this.addView(contentView);
        const leftActionbar = this.createActionbar(
            leftItems,
            UIActionbarAlignment.Left
        );
        this._leftActionbar = leftActionbar;
        this.addView(leftActionbar);

        const rightActionbar = this.createActionbar(
            rightItems,
            UIActionbarAlignment.Right
        );
        this._rightActionbar = rightActionbar;
        this.addView(rightActionbar);

        const leftColumn = new UIColumn({
            width: wrapUiSize,
            height: wrapUiSize,
        });

        const rightColumn = new UIColumn({
            width: wrapUiSize,
            height: wrapUiSize,
        });

        this._leftExpandedMenuColumn = leftColumn;
        this._rightExpandedMenuColumn = rightColumn;

        this.addView(leftColumn);
        this.addView(rightColumn);
    }

    setLeftMenu(items: UIActionbarItem[]) {
        this._leftActionbar.updateItems(items);
    }

    setRightMenu(items: UIActionbarItem[]) {
        this._rightActionbar.updateItems(items);
    }

    setLeftExpandedMenu(items: UIActionbarItem[]) {
        this._leftExpandedMenu = items;
        this.setExpandedMenu(this._leftExpandedMenuColumn, items);
    }

    setRightExpandedMenu(items: UIActionbarItem[]) {
        this._rightExpandedMenu = items;
        this.setExpandedMenu(this._rightExpandedMenuColumn, items);
    }

    resetExpandedMenu() {
        if (this._leftExpandedMenu.length > 0) {
            this._leftExpandedMenuColumn.clearViews();
            this._leftExpandedMenu = [];
            this._leftExpandedMenuIndex = 0;
        }

        if (this._rightExpandedMenu.length > 0) {
            this._rightExpandedMenuColumn.clearViews();
            this._rightExpandedMenu = [];
            this._rightExpandedMenuIndex = 0;
        }
    }

    override hitTest(screenPoint: Point): boolean {
        return false;
    }

    override layout(
        layoutContext: UILayoutContext,
        constraints: UISize
    ): UISize {
        //Measure the actionbars first
        //We start with the left actionbar as it should be collapsed last
        //if there is not enough space
        const horizontalPadding = this._sides.left + this._sides.right;
        const verticalPadding = this._sides.top + this._sides.bottom;
        const paddedConstraints = {
            width: constraints.width - horizontalPadding,
            height: constraints.height - verticalPadding,
        };

        const actionbarConstraints = {
            //Reserve some width for the right actionbar.
            //We substract a value here to avoid the need to do a
            //layout pass again if there is not enough space
            width: paddedConstraints.width - 100,
            height: actionbarHeight,
        };

        let leftLayout: UISize = { width: 0, height: 0 };

        //Layout the left actionbar if it is defined
        leftLayout = this._leftActionbar.layout(
            layoutContext,
            actionbarConstraints
        );

        //Layout the right actionbar if it is defined

        const rightConstraints = {
            width: paddedConstraints.width - leftLayout.width,
            height: actionbarHeight,
        };

        this._rightActionbar.layout(layoutContext, rightConstraints);

        //Now we can measure the content view
        const contentConstraints = {
            width: paddedConstraints.width,
            height: paddedConstraints.height - actionbarHeight,
        };

        const contentSize = this.contentView.layout(
            layoutContext,
            contentConstraints
        );

        //Layout the expanded views
        if (this._leftExpandedMenuColumn) {
            const leftExpandedMenuSize = this._leftExpandedMenuColumn.layout(
                layoutContext,
                contentConstraints
            );

            this._leftExpandedMenuColumn.offset = {
                x: this._sides.left,
                y:
                    this._sides.top +
                    contentSize.height -
                    leftExpandedMenuSize.height,
            };
        }

        if (this._rightExpandedMenuColumn) {
            const rightExpandedMenuSize = this._rightExpandedMenuColumn.layout(
                layoutContext,
                contentConstraints
            );

            this._rightExpandedMenuColumn.offset = {
                x:
                    this._sides.right +
                    contentSize.height -
                    rightExpandedMenuSize.width,
                y:
                    this._sides.top +
                    contentSize.height -
                    rightExpandedMenuSize.height,
            };
        }

        //The measured size includes the padding, so we are just setting
        //the constraints we received here
        this._measuredSize = {
            width: constraints.width,
            height: constraints.height,
        };

        //Position the actionbars
        //The left actionbar is positioned at the bottom left
        //The right actionbar is positioned at the bottom right
        this._leftActionbar.offset = {
            x: this._sides.left,
            y: constraints.height - actionbarHeight - this._sides.bottom,
        };

        const size = this._rightActionbar.measuredSize.width;
        this._rightActionbar.offset = {
            x: constraints.width - size - this._sides.right,
            y: constraints.height - actionbarHeight - this._sides.bottom,
        };

        this.contentView.offset = {
            x: this._sides.left,
            y: this._sides.top,
        };

        return this._measuredSize;
    }
    override draw(context: UIRenderContext): void {
        this.contentView.draw(context);
        if (this._leftActionbar.children.length > 0) {
            this._leftActionbar.draw(context);
        }
        if (this._rightActionbar.children.length > 0) {
            this._rightActionbar.draw(context);
        }

        if (this._leftExpandedMenu.length > 0) {
            this._leftExpandedMenuColumn.draw(context);
        }

        if (this._rightExpandedMenu.length > 0) {
            this._rightExpandedMenuColumn.draw(context);
        }
    }

    private createActionbar(
        items: UIActionbarItem[],
        alignment: UIActionbarAlignment
    ): UIActionbar {
        return new UIActionbar(
            items,
            new SpriteBackground(sprites2.stone_slate_background_2x),
            alignment,
            {
                width: wrapUiSize,
                height: wrapUiSize,
            }
        );
    }

    private setExpandedMenu(menu: UIColumn, items: UIActionbarItem[]) {
        const buttons = items.map((item) => {
            return new UIActionbarButton(item, background);
        });

        menu.clearViews();
        for (const button of buttons) {
            menu.addView(button);
        }
    }
}
