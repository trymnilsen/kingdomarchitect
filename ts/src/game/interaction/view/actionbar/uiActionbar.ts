import { Sprite2 } from "../../../../module/asset/sprite.js";
import { Point } from "../../../../common/point.js";
import { UIRenderScope } from "../../../../rendering/uiRenderContext.js";
import { UIBackground } from "../../../../ui/uiBackground.js";
import { UILayoutScope } from "../../../../ui/uiLayoutContext.js";
import { UISize } from "../../../../ui/uiSize.js";
import { UIView } from "../../../../ui/uiView.js";
import { UIActionbarButton } from "./uiActionbarButton.js";

export type UIActionbarItem = {
    text: string;
    onClick?: () => void;
    children?: ReadonlyArray<Omit<UIActionbarItem, "children">>;
    icon?: Sprite2;
};

export enum UIActionbarAlignment {
    Left,
    Right,
}

export class UIActionbar extends UIView {
    constructor(
        private items: UIActionbarItem[],
        private background: UIBackground,
        private aligment: UIActionbarAlignment,
        size: UISize,
    ) {
        super(size);
        this.updateItems(items);
    }

    updateItems(items: UIActionbarItem[]) {
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

    override hitTest(): boolean {
        return false;
    }
    override layout(layoutContext: UILayoutScope, constraints: UISize): UISize {
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
    override draw(context: UIRenderScope): void {
        for (const child of this.children) {
            child.draw(context);
        }
    }
}
