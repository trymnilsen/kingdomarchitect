import { wrap } from "module";
import { sprites2 } from "../../../asset/sprite.js";
import { Point } from "../../../common/point.js";
import { allSides } from "../../../common/sides.js";
import {
    graySubTitleTextStyle,
    subTitleTextStyle,
} from "../../../rendering/text/textStyle.js";
import { UIRenderContext } from "../../../rendering/uiRenderContext.js";
import {
    colorBackground,
    ninePatchBackground,
} from "../../../ui/dsl/uiBackgroundDsl.js";
import { uiBox } from "../../../ui/dsl/uiBoxDsl.js";
import { uiColumn } from "../../../ui/dsl/uiColumnDsl.js";
import { spriteImageSource, uiImage } from "../../../ui/dsl/uiImageDsl.js";
import { uiRow } from "../../../ui/dsl/uiRowDsl.js";
import { uiSpace } from "../../../ui/dsl/uiSpaceDsl.js";
import { uiText } from "../../../ui/dsl/uiTextDsl.js";
import { HorizontalAlignment } from "../../../ui/uiAlignment.js";
import { NinePatchBackground } from "../../../ui/uiBackground.js";
import { UILayoutContext } from "../../../ui/uiLayoutContext.js";
import { UISize, wrapUiSize } from "../../../ui/uiSize.js";
import { UIView } from "../../../ui/uiView.js";
import { UIBox } from "../../../ui/view/uiBox.js";

export class UISelectorInfoPanel extends UIBox {
    constructor(size: UISize) {
        super(size);
        this.addView(
            uiColumn({
                width: wrapUiSize,
                height: wrapUiSize,
                children: [
                    {
                        child: uiBox({
                            background: ninePatchBackground({
                                sprite: sprites2.stone_slate_background_2x,
                                sides: allSides(16),
                            }),
                            padding: allSides(16),
                            width: wrapUiSize,
                            height: wrapUiSize,
                            children: [
                                uiRow({
                                    width: wrapUiSize,
                                    height: wrapUiSize,
                                    children: [
                                        {
                                            child: uiImage({
                                                width: 32,
                                                height: 32,
                                                image: spriteImageSource(
                                                    sprites2.building_blacksmith,
                                                ),
                                            }),
                                        },
                                        {
                                            child: uiSpace({
                                                width: 16,
                                                height: 8,
                                            }),
                                        },
                                        {
                                            child: uiColumn({
                                                width: wrapUiSize,
                                                height: wrapUiSize,
                                                horizontalAlignment:
                                                    HorizontalAlignment.Left,
                                                children: [
                                                    {
                                                        child: uiText({
                                                            text: "Bobs and bits",
                                                            width: wrapUiSize,
                                                            height: wrapUiSize,
                                                            style: subTitleTextStyle,
                                                        }),
                                                    },
                                                    {
                                                        child: uiText({
                                                            text: "Blacksmith",
                                                            width: wrapUiSize,
                                                            height: wrapUiSize,
                                                            style: graySubTitleTextStyle,
                                                        }),
                                                    },
                                                ],
                                            }),
                                        },
                                    ],
                                }),
                            ],
                        }),
                    },
                ],
            }),
        );
    }
}
