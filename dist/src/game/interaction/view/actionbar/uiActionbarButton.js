function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { subTitleTextStyle } from "../../../../rendering/text/textStyle.js";
import { uiButton } from "../../../../ui/dsl/uiButtonDsl.js";
import { uiColumn } from "../../../../ui/dsl/uiColumnDsl.js";
import { spriteImageSource, uiImage } from "../../../../ui/dsl/uiImageDsl.js";
import { uiText } from "../../../../ui/dsl/uiTextDsl.js";
import { wrapUiSize } from "../../../../ui/uiSize.js";
import { UIBox } from "../../../../ui/view/uiBox.js";
import { actionbarHeight, actionbarWidth } from "./uiActionbarConstants.js";
export class UIActionbarButton extends UIBox {
    constructor(item, buttonBackground){
        super({
            width: actionbarWidth,
            height: actionbarHeight
        });
        _define_property(this, "item", void 0);
        _define_property(this, "buttonBackground", void 0);
        this.item = item;
        this.buttonBackground = buttonBackground;
        let icon = [];
        if (item.icon) {
            icon = [
                uiImage({
                    width: 32,
                    height: 32,
                    image: spriteImageSource(item.icon)
                })
            ];
        }
        this.addView(uiColumn({
            width: wrapUiSize,
            height: wrapUiSize,
            children: [
                {
                    child: uiButton({
                        width: 48,
                        height: 48,
                        id: `actionButton${item.text}`,
                        onTapCallback: ()=>{
                            if (item.onClick) {
                                item.onClick();
                            } else {
                                console.log(`No callback for ${item.text}`);
                            }
                        },
                        children: icon,
                        defaultBackground: this.buttonBackground
                    })
                },
                {
                    child: uiText({
                        width: wrapUiSize,
                        height: wrapUiSize,
                        text: item.text,
                        style: subTitleTextStyle
                    })
                }
            ]
        }));
    }
}
