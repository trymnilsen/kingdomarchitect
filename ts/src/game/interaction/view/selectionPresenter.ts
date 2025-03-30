import { sprites2 } from "../../../module/asset/sprite.js";
import { allSides, HorizontalSide } from "../../../common/sides.js";
import { subTitleTextStyle } from "../../../rendering/text/textStyle.js";
import {
    colorBackground,
    ninePatchBackground,
} from "../../../module/ui/dsl/uiBackgroundDsl.js";
import { uiBox } from "../../../module/ui/dsl/uiBoxDsl.js";
import { uiButton } from "../../../module/ui/dsl/uiButtonDsl.js";
import { uiColumn } from "../../../module/ui/dsl/uiColumnDsl.js";
import {
    spriteImageSource,
    uiImage,
} from "../../../module/ui/dsl/uiImageDsl.js";
import { uiRow } from "../../../module/ui/dsl/uiRowDsl.js";
import { uiSpace } from "../../../module/ui/dsl/uiSpaceDsl.js";
import { uiStack } from "../../../module/ui/dsl/uiStack.js";
import { uiText } from "../../../module/ui/dsl/uiTextDsl.js";
import { uiAlignment } from "../../../module/ui/uiAlignment.js";
import { SpriteBackground } from "../../../module/ui/uiBackground.js";
import { fillUiSize, wrapUiSize } from "../../../module/ui/uiSize.js";
import { UIView } from "../../../module/ui/uiView.js";
import { UIBox } from "../../../module/ui/view/uiBox.js";
import { UIColumn } from "../../../module/ui/view/uiColumn.js";
import { SelectionInfo } from "../../componentOld/selection/selectionInfo.js";
import { UIActionbarItem } from "./actionbar/uiActionbar.js";
import { actionbarWidth } from "./actionbar/uiActionbarConstants.js";
import { UIActionbarScaffold } from "./actionbar/uiActionbarScaffold.js";
import { StatePresenter } from "./statePresenter.js";
import { UISelectorInfoPanel } from "./uiSelectionInfoPanel.js";

export class SelectionPresenter implements StatePresenter {
    private scaffold: UIActionbarScaffold;

    private expandedMenu: UIColumn;
    private expandedMenuPadding: UIBox;
    private selectionInfo: UISelectorInfoPanel;

    get root(): UIView {
        return this.scaffold;
    }

    constructor(
        private leftActionbarItems: ReadonlyArray<UIActionbarItem>,
        private rightActionbarItems: ReadonlyArray<UIActionbarItem>,
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
        this.selectionInfo = new UISelectorInfoPanel({
            width: wrapUiSize,
            height: wrapUiSize,
        });

        const content = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: allSides(12),
            alignment: uiAlignment.bottomLeft,
            //background: colorBackground("#FF00FF44"),
            children: [
                this.selectionInfo,
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

    setSelectionInfo(item: SelectionInfo | null) {
        this.selectionInfo.selectionInfo = item;
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
