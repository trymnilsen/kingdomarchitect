import { sprites2 } from "../../../asset/sprite.js";
import { allSides, HorizontalSide } from "../../../common/sides.js";
import { subTitleTextStyle } from "../../../rendering/text/textStyle.js";
import {
    colorBackground,
    ninePatchBackground,
} from "../../../ui/dsl/uiBackgroundDsl.js";
import { uiBox } from "../../../ui/dsl/uiBoxDsl.js";
import { uiButton } from "../../../ui/dsl/uiButtonDsl.js";
import { uiColumn } from "../../../ui/dsl/uiColumnDsl.js";
import { spriteImageSource, uiImage } from "../../../ui/dsl/uiImageDsl.js";
import { uiStack } from "../../../ui/dsl/uiStack.js";
import { uiText } from "../../../ui/dsl/uiTextDsl.js";
import { uiAlignment } from "../../../ui/uiAlignment.js";
import { SpriteBackground } from "../../../ui/uiBackground.js";
import { fillUiSize, wrapUiSize } from "../../../ui/uiSize.js";
import { UIView } from "../../../ui/uiView.js";
import { UIBox } from "../../../ui/view/uiBox.js";
import { UIColumn } from "../../../ui/view/uiColumn.js";
import { UIActionbarItem } from "./actionbar/uiActionbar.js";
import { actionbarWidth } from "./actionbar/uiActionbarConstants.js";
import { UIActionbarScaffold } from "./actionbar/uiActionbarScaffold.js";
import { SelectionTile } from "./selectionTile.js";
import { StatePresenter } from "./statePresenter.js";

export class SelectionPresenter implements StatePresenter {
    private scaffold: UIActionbarScaffold;

    private expandedMenu: UIColumn;
    private expandedMenuPadding: UIBox;
    private leftSelectionTile: SelectionTile;
    private rightSelectionTile: SelectionTile;

    get root(): UIView {
        return this.scaffold;
    }

    constructor(
        private leftActionbarItems: ReadonlyArray<UIActionbarItem>,
        private rightActionbarItems: ReadonlyArray<UIActionbarItem>,
    ) {
        this.leftSelectionTile = new SelectionTile(HorizontalSide.Left);
        this.rightSelectionTile = new SelectionTile(HorizontalSide.Right);
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
            alignment: uiAlignment.bottomCenter,
            //background: colorBackground("#FF00FF44"),
            children: [
                /*uiStack({
                    height: wrapUiSize,
                    width: fillUiSize,
                    children: [this.leftSelectionTile, this.rightSelectionTile],
                }),*/
            ],
        });

        this.scaffold = new UIActionbarScaffold(
            content,
            leftActionbarItems,
            rightActionbarItems,
            { width: fillUiSize, height: fillUiSize },
        );
    }

    setLeftMenu(items: ReadonlyArray<UIActionbarItem>) {
        this.scaffold.setLeftMenu(items);
    }

    setRightMenu(items: ReadonlyArray<UIActionbarItem>) {
        this.scaffold.setRightMenu(items);
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
