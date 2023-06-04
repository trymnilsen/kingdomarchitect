import { sprites2 } from "../../../../../asset/sprite";
import { subTitleTextStyle } from "../../../../../rendering/text/textStyle";
import { uiBox } from "../../../../../ui/dsl/uiBoxDsl";
import { uiButton } from "../../../../../ui/dsl/uiButtonDsl";
import { uiColumn } from "../../../../../ui/dsl/uiColumnDsl";
import { spriteImageSource, uiImage } from "../../../../../ui/dsl/uiImageDsl";
import { uiText } from "../../../../../ui/dsl/uiTextDsl";
import { uiAlignment } from "../../../../../ui/uiAlignment";
import { SpriteBackground } from "../../../../../ui/uiBackground";
import { fillUiSize, wrapUiSize } from "../../../../../ui/uiSize";
import { UIView } from "../../../../../ui/uiView";
import { UIBox } from "../../../../../ui/view/uiBox";
import { UIColumn } from "../../../../../ui/view/uiColumn";
import { UIActionbarItem } from "../../../view/actionbar/uiActionbar";
import { actionbarWidth } from "../../../view/actionbar/uiActionbarConstants";
import { UIActionbarScaffold } from "../../../view/actionbar/uiActionbarScaffold";
import { StatePresenter } from "../../../view/statePresenter";

export class ActorSelectionPresenter implements StatePresenter {
    private scaffold: UIActionbarScaffold;

    private expandedMenu: UIColumn;
    private expandedMenuPadding: UIBox;

    public get root(): UIView {
        return this.scaffold;
    }

    constructor(
        private leftActionbarItems: UIActionbarItem[],
        private rightActionbarItems: UIActionbarItem[]
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
            alignment: uiAlignment.bottomRight,
            children: [this.expandedMenuPadding],
        });

        this.scaffold = new UIActionbarScaffold(
            content,
            leftActionbarItems,
            rightActionbarItems,
            { width: fillUiSize, height: fillUiSize }
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
                                                `No callback for ${item.text}`
                                            );
                                        }
                                    },
                                    children: icon,
                                    defaultBackground: new SpriteBackground(
                                        sprites2.stone_slate_button_2x
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
