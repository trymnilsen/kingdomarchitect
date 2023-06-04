import { subTitleTextStyle } from "../../../../rendering/text/textStyle";
import { uiButton } from "../../../../ui/dsl/uiButtonDsl";
import { uiColumn } from "../../../../ui/dsl/uiColumnDsl";
import { spriteImageSource, uiImage } from "../../../../ui/dsl/uiImageDsl";
import { uiText } from "../../../../ui/dsl/uiTextDsl";
import { UIBackground } from "../../../../ui/uiBackground";
import { wrapUiSize } from "../../../../ui/uiSize";
import { UIView } from "../../../../ui/uiView";
import { UIBox } from "../../../../ui/view/uiBox";
import { UIActionbarItem } from "./uiActionbar";
import { actionbarHeight, actionbarWidth } from "./uiActionbarConstants";

export class UIActionbarButton extends UIBox {
    constructor(
        private item: UIActionbarItem,
        private buttonBackground: UIBackground
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
                        child: uiText({
                            width: wrapUiSize,
                            height: wrapUiSize,
                            text: item.text,
                            style: subTitleTextStyle,
                        }),
                    },
                ],
            })
        );
    }
}
