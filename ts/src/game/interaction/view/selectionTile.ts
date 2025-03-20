import { sprites2 } from "../../../module/asset/sprite.js";
import { Point } from "../../../common/point.js";
import { allSides, HorizontalSide } from "../../../common/sides.js";
import {
    subTitleTextStyle,
    titleTextStyle,
} from "../../../rendering/text/textStyle.js";
import { UIRenderScope } from "../../../rendering/uiRenderContext.js";
import { bookFill, bookInkColor, stoneFill } from "../../../module/ui/color.js";
import {
    boxBackground,
    colorBackground,
    ninePatchBackground,
} from "../../../module/ui/dsl/uiBackgroundDsl.js";
import { uiBox } from "../../../module/ui/dsl/uiBoxDsl.js";
import { uiColumn } from "../../../module/ui/dsl/uiColumnDsl.js";
import {
    spriteImageSource,
    uiImage,
} from "../../../module/ui/dsl/uiImageDsl.js";
import { uiRow } from "../../../module/ui/dsl/uiRowDsl.js";
import { uiSpace } from "../../../module/ui/dsl/uiSpaceDsl.js";
import { uiText } from "../../../module/ui/dsl/uiTextDsl.js";
import { HorizontalAlignment } from "../../../module/ui/uiAlignment.js";
import { UILayoutScope } from "../../../module/ui/uiLayoutContext.js";
import {
    fillUiSize,
    UISize,
    wrapUiSize,
    zeroSize,
} from "../../../module/ui/uiSize.js";
import { UIView, UIViewVisiblity } from "../../../module/ui/uiView.js";
import { UIBox } from "../../../module/ui/view/uiBox.js";

export class SelectionTile extends UIBox {
    constructor(contentAlignment: HorizontalSide) {
        super({ width: wrapUiSize, height: wrapUiSize });
        this.background = ninePatchBackground({
            sprite: sprites2.stone_slate_background_2x,
            sides: allSides(10),
        });
        this.padding = allSides(16);
        const content = [
            {
                child: uiBox({
                    width: 32,
                    height: 32,
                    children: [
                        uiImage({
                            width: fillUiSize,
                            height: fillUiSize,
                            image: spriteImageSource(sprites2.worker),
                        }),
                    ],
                }),
            },
            {
                child: uiSpace({
                    width: 16,
                    height: 1,
                }),
            },
            {
                child: uiColumn({
                    horizontalAlignment: HorizontalAlignment.Left,
                    width: wrapUiSize,
                    height: wrapUiSize,
                    children: [
                        {
                            child: uiBox({
                                width: wrapUiSize,
                                height: wrapUiSize,
                                //background: colorBackground("#FF00AAAA"),
                                children: [
                                    uiText({
                                        text: "Title",
                                        width: wrapUiSize,
                                        height: wrapUiSize,
                                        style: subTitleTextStyle,
                                    }),
                                ],
                            }),
                        },
                        {
                            child: uiText({
                                text: "Subtitle",
                                width: wrapUiSize,
                                height: wrapUiSize,
                                style: subTitleTextStyle,
                            }),
                        },
                    ],
                }),
            },
        ];

        if (contentAlignment == HorizontalSide.Right) {
            content.reverse();
        }

        this.addView(
            uiRow({
                width: wrapUiSize,
                height: wrapUiSize,
                children: content,
            }),
        );
    }

    override hitTest(screenPoint: Point): boolean {
        return (
            super.hitTest(screenPoint) &&
            this.visibility == UIViewVisiblity.Visible
        );
    }

    override layout(layoutContext: UILayoutScope, constraints: UISize): UISize {
        if (this.visibility != UIViewVisiblity.Hidden) {
            const layoutResult = super.layout(layoutContext, constraints);
            this._measuredSize = layoutResult;
            return layoutResult;
        } else {
            return zeroSize();
        }
    }

    override draw(context: UIRenderScope): void {
        if (this.visibility == UIViewVisiblity.Visible) {
            super.draw(context);
        }
    }
}
