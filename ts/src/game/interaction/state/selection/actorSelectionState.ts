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
import { CharacterSkillState } from "../character/characterSkillState";
import { Entity } from "../../../world/entity/entity";
import { EquipmentComponent } from "../../../world/component/inventory/equipmentComponent";

export class ActorSelectionState extends InteractionState {
    constructor(private entity: Entity) {
        super();
    }

    override onActive(): void {
        const items: UIActionbarItem[] = [
            {
                text: "Skills",
                onClick: () => {
                    this.context.stateChanger.push(new CharacterSkillState());
                },
            },
            {
                text: "Stats",
            },
            {
                text: "Close",
            },
        ];
        const rightItems = this.getRightItems();
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

    private getRightItems(): UIActionbarItem[] {
        const items: UIActionbarItem[] = [];
        const equipment = this.entity.getComponent(EquipmentComponent);
        if (equipment && equipment.mainItem) {
            items.push({
                text: "Main",
                icon: equipment.mainItem.asset,
            });
        } else {
            items.push({
                text: "Main",
                icon: sprites2.sword_skill,
            });
        }

        items.push({
            text: "Other",
            icon: sprites2.health_potion,
        });

        return items;
    }
}
