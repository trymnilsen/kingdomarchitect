import { sprites2 } from "../../../../module/asset/sprite.js";
import { allSides } from "../../../../common/sides.js";
import { subTitleTextStyle } from "../../../../rendering/text/textStyle.js";
import { ninePatchBackground } from "../../../../module/ui/dsl/uiBackgroundDsl.js";
import { uiBox } from "../../../../module/ui/dsl/uiBoxDsl.js";
import { uiButton } from "../../../../module/ui/dsl/uiButtonDsl.js";
import { uiColumn } from "../../../../module/ui/dsl/uiColumnDsl.js";
import {
    spriteImageSource,
    uiImage,
} from "../../../../module/ui/dsl/uiImageDsl.js";
import { uiText } from "../../../../module/ui/dsl/uiTextDsl.js";
import { UIBackground } from "../../../../module/ui/uiBackground.js";
import { wrapUiSize } from "../../../../module/ui/uiSize.js";
import { UIView } from "../../../../module/ui/uiView.js";
import { UIBox } from "../../../../module/ui/view/uiBox.js";
import { UIActionbarItem } from "./uiActionbar.js";
import { actionbarHeight, actionbarWidth } from "./uiActionbarConstants.js";

export class UIActionbarButton extends UIBox {
    constructor(
        private item: UIActionbarItem,
        private buttonBackground: UIBackground,
    ) {
        super({
            width: actionbarWidth,
            height: actionbarHeight,
        });

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

        this.addView(
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
                                    console.log(`No callback for ${item.text}`);
                                }
                            },
                            children: icon,
                            defaultBackground: this.buttonBackground,
                        }),
                    },
                    {
                        child: uiBox({
                            width: wrapUiSize,
                            height: wrapUiSize,
                            background: ninePatchBackground({
                                sprite: sprites2.book_grid_item_gray,
                                sides: allSides(8),
                            }),
                            children: [
                                uiText({
                                    wrap: false,
                                    width: wrapUiSize,
                                    height: wrapUiSize,
                                    text: item.text,
                                    style: subTitleTextStyle,
                                }),
                            ],
                        }),
                    },
                ],
            }),
        );
    }
}
