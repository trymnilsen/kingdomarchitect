import { sprites2 } from "../../../../../asset/sprite.js";
import { allSides } from "../../../../../common/sides.js";
import { subTitleTextStyle } from "../../../../../rendering/text/textStyle.js";
import { ninePatchBackground } from "../../../../../ui/dsl/uiBackgroundDsl.js";
import { uiBox } from "../../../../../ui/dsl/uiBoxDsl.js";
import { uiButton } from "../../../../../ui/dsl/uiButtonDsl.js";
import { uiColumn } from "../../../../../ui/dsl/uiColumnDsl.js";
import {
    spriteImageSource,
    uiImage,
} from "../../../../../ui/dsl/uiImageDsl.js";
import { uiText } from "../../../../../ui/dsl/uiTextDsl.js";
import { uiAlignment } from "../../../../../ui/uiAlignment.js";
import { SpriteBackground } from "../../../../../ui/uiBackground.js";
import { fillUiSize, wrapUiSize } from "../../../../../ui/uiSize.js";
import { UIView } from "../../../../../ui/uiView.js";
import { UIBox } from "../../../../../ui/view/uiBox.js";
import { UIColumn } from "../../../../../ui/view/uiColumn.js";
import { UIActionbarItem } from "../../../view/actionbar/uiActionbar.js";
import { actionbarWidth } from "../../../view/actionbar/uiActionbarConstants.js";
import { UIActionbarScaffold } from "../../../view/actionbar/uiActionbarScaffold.js";
import { StatePresenter } from "../../../view/statePresenter.js";

export class ActorSelectionPresenter implements StatePresenter {
    private scaffold: UIActionbarScaffold;

    private expandedMenu: UIColumn;
    private expandedMenuPadding: UIBox;

    get root(): UIView {
        return this.scaffold;
    }

    constructor(
        private leftActionbarItems: UIActionbarItem[],
        private rightActionbarItems: UIActionbarItem[],
    ) {
        this.expandedMenu = new UIColumn({
            width: wrapUiSize,
            height: wrapUiSize,
        });

        this.expandedMenuPadding = new UIBox({
            width: wrapUiSize,
            height: wrapUiSize,
        });
        this.expandedMenuPadding.addView(this.expandedMenu);

        const content = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: allSides(12),
            alignment: uiAlignment.bottomLeft,
            children: [
                uiBox({
                    width: 200,
                    height: 100,
                    background: ninePatchBackground({
                        sprite: sprites2.stone_slate_background_2x,
                        sides: allSides(10),
                    }),
                }),
            ],
        });

        this.scaffold = new UIActionbarScaffold(
            content,
            leftActionbarItems,
            rightActionbarItems,
            { width: fillUiSize, height: fillUiSize },
        );
    }

    setExpandedMenu(items: UIActionbarItem[]) {
        const menuViews = items.map((item) => {
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
                                                `No callback for ${item.text}`,
                                            );
                                        }
                                    },
                                    children: icon,
                                    defaultBackground: new SpriteBackground(
                                        sprites2.stone_slate_button_2x,
                                    ),
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
        this.expandedMenuPadding.padding = {
            right: actionbarWidth,
            left: 0,
            top: 0,
            bottom: 0,
        };
        this.expandedMenu.clearViews();
        for (const view of menuViews) {
            this.expandedMenu.addView(view);
        }
    }
}
