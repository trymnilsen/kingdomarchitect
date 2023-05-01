import { sprites2 } from "../../../../asset/sprite";
import { ninePatchBackground } from "../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { SpriteBackground } from "../../../../ui/uiBackground";
import { fillUiSize } from "../../../../ui/uiSize";
import {
    UIActionbar,
    UIActionbarAlignment,
    UIActionbarItem,
} from "../../view/actionbar/uiActionbar";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold";
import { InteractionState } from "../../handler/interactionState";

export class ActorSelectionState extends InteractionState {
    constructor() {
        super();
    }

    override onActive(): void {
        const items: UIActionbarItem[] = [
            {
                text: "Skills",
            },
            {
                text: "Stats",
            },
            {
                text: "Close",
            },
        ];
        const rightItems: UIActionbarItem[] = [
            {
                text: "Main",
                icon: sprites2.sword_skill,
            },
            {
                text: "Other",
                icon: sprites2.health_potion,
            },
        ];
        const leftActionBar = new UIActionbar(
            items,
            ninePatchBackground({
                sprite: sprites2.stone_slate_background,
                scale: 2,
            }),
            UIActionbarAlignment.Left,
            {
                width: fillUiSize,
                height: fillUiSize,
            }
        );
        const rightActionBar = new UIActionbar(
            rightItems,
            new SpriteBackground(sprites2.stone_slate_button_2x),
            UIActionbarAlignment.Right,
            {
                width: fillUiSize,
                height: fillUiSize,
            }
        );
        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
        });
        const scaffoldState = new UIActionbarScaffold(
            contentView,
            leftActionBar,
            rightActionBar,
            { width: fillUiSize, height: fillUiSize }
        );

        this.view = scaffoldState;
    }
}
