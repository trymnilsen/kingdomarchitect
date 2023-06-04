import { Sprite2 } from "../../../../asset/sprite";
import { Point } from "../../../../common/point";
import { UIRenderContext } from "../../../../rendering/uiRenderContext";
import { UIBackground } from "../../../../ui/uiBackground";
import { UILayoutContext } from "../../../../ui/uiLayoutContext";
import { UISize } from "../../../../ui/uiSize";
import { UIView } from "../../../../ui/uiView";
import { UIActionbarButton } from "./uiActionbarButton";

export interface UIActionbarItem {
    text: string;
    onClick?: () => void;
    children?: Omit<UIActionbarItem, "children">[];
    icon?: Sprite2;
}

export enum UIActionbarAlignment {
    Left,
    Right,
}

export class UIActionbar extends UIView {
    constructor(
        private items: UIActionbarItem[],
        private background: UIBackground,
        private aligment: UIActionbarAlignment,
        size: UISize
    ) {
        super(size);
        this.updateItems(items);
    }

    public updateItems(items: UIActionbarItem[]) {
        this.clearViews();
        this.items = items;
        const views = this.items.map((item) => {
            return new UIActionbarButton(item, this.background);
        });

        //Add the views as children
        for (const view of views) {
            this.addView(view);
        }
    }

    override hitTest(screenPoint: Point): boolean {
        return false;
    }
    override layout(
        layoutContext: UILayoutContext,
        constraints: UISize
    ): UISize {
        let usedWidth = 0;
        for (const child of this.children) {
            const constraint = {
                width: constraints.width / this.children.length,
                height: constraints.height,
            };
            const childSize = child.layout(layoutContext, constraint);
            child.offset = {
                x: usedWidth,
                y: 0,
            };
            usedWidth += childSize.width;
        }

        this._measuredSize = {
            width: usedWidth,
            height: constraints.height,
        };

        return this._measuredSize;
    }
    override draw(context: UIRenderContext): void {
        for (const child of this.children) {
            child.draw(context);
        }
    }
}
