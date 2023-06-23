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
import { sprites2 } from "../../../../../asset/sprite.js";
import { subTitleTextStyle } from "../../../../../rendering/text/textStyle.js";
import { uiBox } from "../../../../../ui/dsl/uiBoxDsl.js";
import { uiButton } from "../../../../../ui/dsl/uiButtonDsl.js";
import { uiColumn } from "../../../../../ui/dsl/uiColumnDsl.js";
import { spriteImageSource, uiImage } from "../../../../../ui/dsl/uiImageDsl.js";
import { uiText } from "../../../../../ui/dsl/uiTextDsl.js";
import { uiAlignment } from "../../../../../ui/uiAlignment.js";
import { SpriteBackground } from "../../../../../ui/uiBackground.js";
import { fillUiSize, wrapUiSize } from "../../../../../ui/uiSize.js";
import { UIBox } from "../../../../../ui/view/uiBox.js";
import { UIColumn } from "../../../../../ui/view/uiColumn.js";
import { actionbarWidth } from "../../../view/actionbar/uiActionbarConstants.js";
import { UIActionbarScaffold } from "../../../view/actionbar/uiActionbarScaffold.js";
export class ActorSelectionPresenter {
    get root() {
        return this.scaffold;
    }
    setExpandedMenu(items) {
        const menuViews = items.map((item)=>{
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
                                    onTapCallback: ()=>{
                                        if (item.onClick) {
                                            item.onClick();
                                        } else {
                                            console.log(`No callback for ${item.text}`);
                                        }
                                    },
                                    children: icon,
                                    defaultBackground: new SpriteBackground(sprites2.stone_slate_button_2x)
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
                    })
                ]
            });
        });
        this.expandedMenuPadding.padding = {
            right: actionbarWidth,
            left: 0,
            top: 0,
            bottom: 0
        };
        this.expandedMenu.clearViews();
        for (const view of menuViews){
            this.expandedMenu.addView(view);
        }
    }
    constructor(leftActionbarItems, rightActionbarItems){
        _define_property(this, "leftActionbarItems", void 0);
        _define_property(this, "rightActionbarItems", void 0);
        _define_property(this, "scaffold", void 0);
        _define_property(this, "expandedMenu", void 0);
        _define_property(this, "expandedMenuPadding", void 0);
        this.leftActionbarItems = leftActionbarItems;
        this.rightActionbarItems = rightActionbarItems;
        this.expandedMenu = new UIColumn({
            width: wrapUiSize,
            height: wrapUiSize
        });
        this.expandedMenuPadding = new UIBox({
            width: wrapUiSize,
            height: wrapUiSize
        });
        this.expandedMenuPadding.addView(this.expandedMenu);
        const content = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            alignment: uiAlignment.bottomRight,
            children: [
                this.expandedMenuPadding
            ]
        });
        this.scaffold = new UIActionbarScaffold(content, leftActionbarItems, rightActionbarItems, {
            width: fillUiSize,
            height: fillUiSize
        });
    }
}
