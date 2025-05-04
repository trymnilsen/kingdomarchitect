import { sprites2 } from "../../../module/asset/sprite.js";
import { allSides } from "../../../common/sides.js";
import { subTitleTextStyle } from "../../../rendering/text/textStyle.js";
import {
    colorBackground,
    ninePatchBackground,
} from "../../../module/ui/dsl/uiBackgroundDsl.js";
import { uiBox } from "../../../module/ui/dsl/uiBoxDsl.js";
import { uiButton } from "../../../module/ui/dsl/uiButtonDsl.js";
import {
    spriteImageSource,
    uiImage,
} from "../../../module/ui/dsl/uiImageDsl.js";
import { uiRow } from "../../../module/ui/dsl/uiRowDsl.js";
import { uiSpace } from "../../../module/ui/dsl/uiSpaceDsl.js";
import { uiText } from "../../../module/ui/dsl/uiTextDsl.js";
import { uiAlignment } from "../../../module/ui/uiAlignment.js";
import { fillUiSize, wrapUiSize } from "../../../module/ui/uiSize.js";
import { UIView } from "../../../module/ui/uiView.js";
import { UIText } from "../../../module/ui/view/uiText.js";

export class InteractionHandlerStatusbarPresenter {
    private _rootView: UIView;
    private _labelTextView: UIText;

    public get rootView(): UIView {
        return this._rootView;
    }

    public get label(): string {
        return this._labelTextView.text;
    }

    public set label(v: string) {
        this._labelTextView.text = v;
    }

    constructor(label: string, onVisibilityTap: () => void) {
        this._labelTextView = uiText({
            text: label,
            width: wrapUiSize,
            height: wrapUiSize,
            style: subTitleTextStyle,
        });
        this._rootView = uiBox({
            width: fillUiSize,
            height: wrapUiSize,
            padding: allSides(8),
            //background: colorBackground("#191a19"),
            //alignment: uiAlignment.center,
            children: [
                uiRow({
                    width: fillUiSize,
                    height: 32,
                    children: [
                        {
                            child: uiBox({
                                width: 32,
                                height: 32,
                                background: ninePatchBackground({
                                    sprite: sprites2.book_border,
                                    scale: 1,
                                    sides: allSides(8),
                                }),
                                padding: allSides(8),
                                children: [
                                    uiImage({
                                        width: 16,
                                        height: 16,
                                        image: spriteImageSource(
                                            sprites2.times,
                                        ),
                                    }),
                                ],
                            }),
                        },
                        {
                            child: uiBox({
                                width: wrapUiSize,
                                height: 32,
                                padding: allSides(8),
                                background: ninePatchBackground({
                                    sprite: sprites2.book_border,
                                    scale: 1,
                                    sides: allSides(8),
                                }),
                                children: [this._labelTextView],
                            }),
                        },
                        {
                            weight: 1,
                            child: uiSpace({
                                width: 32,
                                height: 32,
                                id: "space",
                            }),
                        },
                        {
                            child: uiButton({
                                width: 32,
                                height: 32,
                                padding: allSides(8),
                                onTappedBackground: ninePatchBackground({
                                    sprite: sprites2.book_grid_item,
                                    scale: 1,
                                    sides: allSides(8),
                                }),
                                defaultBackground: ninePatchBackground({
                                    sprite: sprites2.book_border,
                                    scale: 1,
                                    sides: allSides(8),
                                }),
                                onTapCallback: onVisibilityTap,
                                children: [
                                    uiImage({
                                        width: 16,
                                        height: 16,
                                        image: spriteImageSource(
                                            sprites2.light,
                                        ),
                                    }),
                                ],
                            }),
                        },
                    ],
                }),
            ],
        });
    }
}
