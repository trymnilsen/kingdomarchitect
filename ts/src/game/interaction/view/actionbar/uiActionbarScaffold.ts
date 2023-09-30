import { sprites2 } from "../../../../asset/sprite.js";
import {
    Bounds,
    sizeOfBounds,
    withinRectangle,
} from "../../../../common/bounds.js";
import { Axis, invertAxis } from "../../../../common/direction.js";
import { Point, addPoint, zeroPoint } from "../../../../common/point.js";
import {
    Sides,
    allSides,
    totalHorizontal,
    totalVertical,
} from "../../../../common/sides.js";
import { subTitleTextStyle } from "../../../../rendering/text/textStyle.js";
import { UIRenderContext } from "../../../../rendering/uiRenderContext.js";
import { UILayoutContext } from "../../../../ui/uiLayoutContext.js";
import { UISize } from "../../../../ui/uiSize.js";
import { UIView } from "../../../../ui/uiView.js";
import { UIActionbarItem } from "./uiActionbar.js";

export class UIActionbarScaffold extends UIView {
    private _sides: Sides = allSides(16);
    private buttons: ActionbarButton[] = [];
    private selectedPath: string = "";

    /**
     * Get the padding for the content and action bar
     */
    public get sides(): Sides {
        return this._sides;
    }

    /**
     * Set the padding for the content and action bar
     */
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
    }

    /**
     * Update the actionbar buttons show in the left actionbar
     * @param items The updated set of items
     */
    setLeftMenu(items: UIActionbarItem[]) {
        this.leftItems = items;
        this._isDirty = true;
    }

    /**
     * Update the actionbar buttons show in the right actionbar
     * @param items The updated set of items
     */
    setRightMenu(items: UIActionbarItem[]) {
        this.rightItems = items;
        this._isDirty = true;
    }

    override hitTest(screenPoint: Point): boolean {
        return true;
    }

    override layout(
        layoutContext: UILayoutContext,
        constraints: UISize
    ): UISize {
        //Measure the actionbars first
        //We start with the left actionbar as it should be collapsed last
        //if there is not enough space
        const paddedConstraints = {
            width: constraints.width - totalHorizontal(this.sides),
            height: constraints.height - totalVertical(this.sides),
        };

        const actionbarSize = this.layoutActionbar(
            layoutContext,
            paddedConstraints
        );

        const contentConstraints = {
            width: paddedConstraints.width,
            height: paddedConstraints.height - actionbarSize.height,
        };

        this.layoutContentView(layoutContext, contentConstraints);

        //The measured size includes the padding, so we are just setting
        //the constraints we received here
        this._measuredSize = {
            width: constraints.width,
            height: constraints.height,
        };

        return this._measuredSize;
    }

    override draw(context: UIRenderContext): void {
        this.contentView.draw(context);
        if (this.buttons.length > 0) {
            this.drawActionbar(context, this.buttons);
        }
    }

    override onTap(screenPoint: Point): boolean {
        return this.checkForTapOnButton(screenPoint, this.buttons);
    }

    /**
     * Draw a list of actionbar buttons, will recursively iterate through
     * children to draw them as well
     * @param context
     * @param actionbar
     */
    private drawActionbar(
        context: UIRenderContext,
        actionbar: ActionbarButton[]
    ) {
        for (const item of actionbar) {
            if (!item.visible) {
                continue;
            }

            const middleX = item.position.x + item.width / 2;

            context.drawNinePatchSprite({
                x: middleX - 24,
                y: item.position.y + 2,
                width: 48,
                height: 48,
                sprite: sprites2.stone_slate_background_2x,
                scale: 1,
                sides: allSides(16),
            });

            if (item.icon) {
                const sprite = context.getSprite(item.icon)
                context.drawScreenSpaceSprite({
                    sprite: sprite,
                    x: middleX - 16,
                    y: item.position.y + 8
                });
            }

            context.drawScreenspaceText({
                text: item.text,
                color: "white",
                width: item.width,
                align: "center",
                x: item.position.x + item.textOffset,
                y: item.position.y + 48 + 2,
                font: subTitleTextStyle.font,
                size: subTitleTextStyle.size,
            });

            if (item.children.length > 0) {
                this.drawActionbar(context, item.children);
            }
        }
    }

    /**
     * Request to layout the action bar and create the actionbar tree structure
     * @param layoutContext the UI context for layouting
     * @param paddedConstraints the constraints (with padding applied)
     * @returns the sized used for the actionbar
     */
    private layoutActionbar(
        layoutContext: UILayoutContext,
        paddedConstraints: UISize
    ): UISize {
        //Get the size of the first level of the left tree
        const leftSize = this.layoutSingleActionbar(
            layoutContext,
            this.leftItems,
            Axis.XAxis
        );
        const rightSize = this.layoutSingleActionbar(
            layoutContext,
            this.rightItems,
            Axis.XAxis
        );
        //Get the size of the first level of the right tree
        let leftActionTree = this.leftItems;
        const rightActionTree = this.rightItems;
        if (
            paddedConstraints.width - rightSize.totalWidth <
            leftSize.totalWidth
        ) {
            //The size of the left actionbar was larger than what was available
            //so we add a level that is just "actions" for the "top-level" left
            //actionbar items
            leftActionTree = [
                {
                    text: "actions",
                    children: this.leftItems,
                },
            ];
        }

        const paddingOffset = {
            x: this.sides.left,
            y: this.sides.top,
        };

        const leftItems = this.layoutActionItems(
            leftActionTree,
            layoutContext,
            paddedConstraints.width,
            paddedConstraints.height,
            {
                x: 0,
                y: paddedConstraints.height,
            },
            paddingOffset,
            ActionbarAlignment.Left,
            Axis.XAxis,
            "left",
            0
        );

        const rightItems = this.layoutActionItems(
            rightActionTree,
            layoutContext,
            paddedConstraints.width,
            paddedConstraints.height,
            {
                x: paddedConstraints.width,
                y: paddedConstraints.height,
            },
            paddingOffset,
            ActionbarAlignment.Right,
            Axis.XAxis,
            "right",
            0
        );

        this.buttons = [...leftItems, ...rightItems];

        return {
            width: paddedConstraints.width,
            height: Math.max(leftSize.totalHeight, rightSize.totalHeight),
        };
    }

    /**
     * Layout a list of `UIActionbarItem` and layout them and their children
     * @param actionbarItems the list of items to turn into buttons
     * @param layoutContext context to use for measuring
     * @param width the total width available (taken from constraints)
     * @param height the total width available (taken from constraints)
     * @param anchor where the actionbar should be anchored
     * @param paddingOffset the padding offset to apply
     * @param alignment the alignment of the actionbars (right or left side)
     * @param axis if the actionbar flows vertically or horizontally
     * @param path an identifyable path for this actionbar (e.g `left/1/2`)
     * @param level the level of actionsbar above this actionbar
     * @returns a list of laid out actionbar buttons
     */
    private layoutActionItems(
        actionbarItems: UIActionbarItem[],
        layoutContext: UILayoutContext,
        width: number,
        height: number,
        anchor: Point,
        paddingOffset: Point,
        alignment: ActionbarAlignment,
        axis: Axis,
        path: string,
        level: number
    ): ActionbarButton[] {
        const actionbar = this.layoutSingleActionbar(
            layoutContext,
            actionbarItems,
            axis
        );

        const actionbarAlignment = getActionbarAlignment(alignment, axis);
        const actionbarOffset = this.calculateAnchorOffset(
            anchor,
            actionbarAlignment,
            width,
            height,
            actionbar.totalWidth,
            actionbar.totalHeight
        );

        // Sanity check for actionbar items size
        if (actionbar.boundaries.length != actionbarItems.length) {
            throw new Error("Amount of actionbar items inconsistency");
        }

        const buttons: ActionbarButton[] = [];
        for (let i = 0; i < actionbar.boundaries.length; i++) {
            const boundary = actionbar.boundaries[i];
            const actionbarItem = actionbarItems[i];
            const size = sizeOfBounds(boundary);
            const position = addPoint(
                { x: boundary.x1, y: boundary.y1 },
                {
                    x: actionbarOffset.x + paddingOffset.x,
                    y: actionbarOffset.y + paddingOffset.y,
                }
            );
            const itemPath = `${path}/${i}`;

            let children: ActionbarButton[] = [];
            if (!!actionbarItem.children && actionbarItem.children.length > 0) {
                const childrenAnchor = this.calculateChildAnchor(
                    size.x,
                    size.y,
                    axis,
                    alignment
                );

                children = this.layoutActionItems(
                    actionbarItem.children,
                    layoutContext,
                    width,
                    height,
                    {
                        x: childrenAnchor.x + position.x,
                        y: childrenAnchor.y + position.y,
                    },
                    zeroPoint(),
                    alignment,
                    invertAxis(axis),
                    itemPath,
                    level + 1
                );
            }

            const textSize = layoutContext.measureText(
                actionbarItem.text,
                subTitleTextStyle
            );
            const textOffset = (size.x - Math.min(textSize.width, size.x)) / 2;
            const isPathOfSelected =
                this.selectedPath != "" &&
                itemPath.startsWith(this.selectedPath);

            const button: ActionbarButton = {
                width: size.x,
                heigth: size.y,
                text: actionbarItem.text,
                textOffset: textOffset,
                onClick: actionbarItem.onClick,
                visible: level == 0 || isPathOfSelected,
                path: itemPath,
                icon: actionbarItem.icon?.id,
                position,
                children,
            };

            buttons.push(button);
        }

        return buttons;
    }

    /**
     * Measure a single level of actionbar items, will be used to detect overflow
     * @param layoutContext
     * @param items
     * @param orientation
     * @returns
     */
    private layoutSingleActionbar(
        layoutContext: UILayoutContext,
        items: UIActionbarItem[],
        orientation: Axis
    ): SingleActionbarLayout {
        let totalWidth = 0;
        let totalHeight = 0;
        const boundaries: Bounds[] = [];
        if (orientation == Axis.XAxis) {
            totalHeight = 72;
            for (const item of items) {
                const x1 = totalWidth;
                totalWidth += actionbarWidth;
                const x2 = totalWidth;
                boundaries.push({
                    x1,
                    x2,
                    y1: 0,
                    y2: totalHeight,
                });
            }
        } else {
            totalWidth = actionbarWidth;
            for (const item of items) {
                const y1 = totalHeight;
                totalHeight += 72;
                const y2 = totalHeight;
                boundaries.push({
                    x1: 0,
                    x2: totalWidth,
                    y1,
                    y2,
                });
            }
        }

        return {
            totalWidth,
            totalHeight,
            boundaries,
        };
    }

    private calculateChildAnchor(
        width: number,
        height: number,
        axis: Axis,
        alignment: ActionbarAlignment
    ): Point {
        if (axis == Axis.XAxis) {
            return {
                x: width / 2,
                y: 0,
            };
        } else {
            if (alignment == ActionbarAlignment.Left) {
                return {
                    x: width,
                    y: height / 2,
                };
            } else {
                return {
                    x: 0,
                    y: height / 2,
                };
            }
        }
    }

    private calculateAnchorOffset(
        anchor: Point,
        anchorAlignment: ActionbarAnchorAlignment,
        constraintsWidth: number,
        constraintsHeight: number,
        actionBarWidth: number,
        actionBarHeight: number
    ): Point {
        if (anchorAlignment == ActionbarAnchorAlignment.Left) {
            return {
                x: anchor.x,
                y: anchor.y - actionBarHeight,
            };
        } else if (anchorAlignment == ActionbarAnchorAlignment.Right) {
            return {
                x: anchor.x - actionBarWidth,
                y: anchor.y - actionBarHeight,
            };
        } else if (anchorAlignment == ActionbarAnchorAlignment.Bottom) {
            return {
                x: anchor.x - actionBarWidth / 2,
                y: anchor.y - actionBarHeight,
            };
        }

        return zeroPoint();
    }

    private checkForTapOnButton(
        point: Point,
        buttons: ActionbarButton[]
    ): boolean {
        for (const button of buttons) {
            if (
                withinRectangle(
                    point,
                    button.position.x,
                    button.position.y,
                    button.position.x + button.width,
                    button.position.y + button.heigth
                )
            ) {
                let handled = false;
                if (button.onClick) {
                    button.onClick();
                    handled = true;
                    this.selectedPath = "";
                }

                if (button.children.length > 0) {
                    if (this.selectedPath == button.path) {
                        this.selectedPath = "";
                    } else {
                        this.selectedPath = button.path;
                    }
                    handled = true;
                }

                return handled;
            }

            if (button.children.length > 0) {
                const childTapResult = this.checkForTapOnButton(
                    point,
                    button.children
                );
                if (childTapResult) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Request to layout the content view
     * @param layoutContext the UI context for layouting
     * @param paddedConstraints constraints minus padding and actionbar height
     */
    private layoutContentView(
        layoutContext: UILayoutContext,
        constraints: UISize
    ) {
        this.contentView.layout(layoutContext, constraints);

        this.contentView.offset = {
            x: this._sides.left,
            y: this._sides.top,
        };
    }
}

const actionbarWidth = 80;

function getActionbarAlignment(
    alignment: ActionbarAlignment,
    axis: Axis
): ActionbarAnchorAlignment {
    if (axis == Axis.YAxis) {
        return ActionbarAnchorAlignment.Bottom;
    } else if (alignment == ActionbarAlignment.Left) {
        return ActionbarAnchorAlignment.Left;
    } else {
        return ActionbarAnchorAlignment.Right;
    }
}

enum ActionbarAlignment {
    Left,
    Right,
}

enum ActionbarAnchorAlignment {
    Left,
    Right,
    Bottom,
}

interface ActionbarButton {
    width: number;
    heigth: number;
    text: string;
    position: Point;
    textOffset: number;
    children: ActionbarButton[];
    visible: boolean;
    path: string;
    onClick?: () => void;
    icon?: string;
}

interface SingleActionbarLayout {
    totalWidth: number;
    totalHeight: number;
    boundaries: Bounds[];
}
