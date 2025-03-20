import { sprites2 } from "../../../module/asset/sprite.js";
import { allSides } from "../../../common/sides.js";
import {
    graySubTitleTextStyle,
    subTitleTextStyle,
} from "../../../rendering/text/textStyle.js";
import { ninePatchBackground } from "../../../module/ui/dsl/uiBackgroundDsl.js";
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
import { UISize, wrapUiSize } from "../../../module/ui/uiSize.js";
import { UIViewVisiblity } from "../../../module/ui/uiView.js";
import { UIBox } from "../../../module/ui/view/uiBox.js";
import { UIImage } from "../../../module/ui/view/uiImage.js";
import { UISpriteImageSource } from "../../../module/ui/view/uiImageSource.js";
import { UIText } from "../../../module/ui/view/uiText.js";
import { SelectionInfo } from "../../component/selection/selectionInfo.js";

export class UISelectorInfoPanel extends UIBox {
    private _selectionInfo: SelectionInfo | null = null;
    private _icon: UIImage;
    private _titleText: UIText;
    private _subtitleText: UIText;

    public get selectionInfo(): SelectionInfo | null {
        return this._selectionInfo;
    }

    public set selectionInfo(value: SelectionInfo | null) {
        this.updateSelection(value);
    }

    constructor(size: UISize) {
        super(size);
        this.visibility = UIViewVisiblity.Invisible;

        this._icon = uiImage({
            width: 32,
            height: 32,
            image: spriteImageSource(sprites2.building_blacksmith),
        });
        this._titleText = uiText({
            text: "",
            width: wrapUiSize,
            height: wrapUiSize,
            style: subTitleTextStyle,
        });
        this._subtitleText = uiText({
            text: "",
            width: wrapUiSize,
            height: wrapUiSize,
            style: graySubTitleTextStyle,
        });

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
                                            child: this._icon,
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
                                                        child: this._titleText,
                                                    },
                                                    {
                                                        child: this
                                                            ._subtitleText,
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

    private updateSelection(selection: SelectionInfo | null) {
        this._selectionInfo = selection;
        if (!!selection) {
            this.visibility = UIViewVisiblity.Visible;
            this._icon.image = new UISpriteImageSource(selection.icon);
            this._titleText.text = selection.title;
            this._subtitleText.text = selection.subtitle;
        } else {
            this.visibility = UIViewVisiblity.Invisible;
        }
    }
}
