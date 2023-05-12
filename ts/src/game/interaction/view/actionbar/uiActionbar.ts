import { Sprite2 } from "../../../../asset/sprite";
import { Point } from "../../../../common/point";
import { subTitleTextStyle } from "../../../../rendering/text/textStyle";
import { UIRenderContext } from "../../../../rendering/uiRenderContext";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { uiButton } from "../../../../ui/dsl/uiButtonDsl";
import { uiColumn } from "../../../../ui/dsl/uiColumnDsl";
import { spriteImageSource, uiImage } from "../../../../ui/dsl/uiImageDsl";
import { uiText } from "../../../../ui/dsl/uiTextDsl";
import { UIBackground } from "../../../../ui/uiBackground";
import { UILayoutContext } from "../../../../ui/uiLayoutContext";
import { UISize, wrapUiSize } from "../../../../ui/uiSize";
import { UIView } from "../../../../ui/uiView";

export const actionbarHeight = 72;
export const actionbarWidth = 72;
export interface UIActionbarItem {
    text: string;
    onClick?: () => void;
    children?: UIActionbarItem[];
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
            let icon: UIView[] = [];
            if (item.icon) {
                icon = [
                    uiImage({
                        width: 32,
                        height: 32,
                        image: spriteImageSource(item.icon),
                    }),
                ];
            }
            return uiBox({
                width: actionbarWidth,
                height: 72,
                children: [
                    uiColumn({
                        width: wrapUiSize,
                        height: wrapUiSize,
                        children: [
                            {
                                child: uiButton({
                                    width: 48,
                                    height: 48,
                                    id: `actionButton${item.text}`,
                                    onTapCallback: () => {
                                        if (item.onClick) {
                                            item.onClick();
                                        } else {
                                            console.log(
                                                `No callback for ${item.text}`
                                            );
                                        }
                                    },
                                    children: icon,
                                    defaultBackground: this.background,
                                }),
                            },
                            {
                                child: uiText({
                                    width: wrapUiSize,
                                    height: wrapUiSize,
                                    text: item.text,
                                    style: subTitleTextStyle,
                                }),
                            },
                        ],
                    }),
                ],
            });
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
