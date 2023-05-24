import { sprites2 } from "../../../../asset/sprite";
import { allSides, symmetricSides } from "../../../../common/sides";
import { meleeSkills } from "../../../../data/skill/melee";
import { SkillTree } from "../../../../data/skill/skill";
import { bookInkColor } from "../../../../ui/color";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { uiText } from "../../../../ui/dsl/uiTextDsl";
import { uiAlignment } from "../../../../ui/uiAlignment";
import { SpriteBackground } from "../../../../ui/uiBackground";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize";
import { UIView } from "../../../../ui/uiView";
import { InteractionState } from "../../handler/interactionState";
import {
    UIActionbar,
    UIActionbarAlignment,
    UIActionbarItem,
} from "../../view/actionbar/uiActionbar";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold";
import { UIBookLayout, UIBookLayoutTab } from "../../view/uiBookLayout";
import { UISkillCategoryTree } from "./uiSkillCategoryTree";

export class CharacterSkillState extends InteractionState {
    private _masterDetailsView: UIBookLayout;

    override get isModal(): boolean {
        return true;
    }

    constructor() {
        super();

        const items: UIActionbarItem[] = [
            {
                icon: sprites2.empty_sprite,
                text: "Unlock",
                onClick: () => {
                    console.log("Unlock");
                },
            },
            {
                icon: sprites2.empty_sprite,
                text: "Cancel",
                onClick: () => {
                    console.log("Unlock");
                },
            },
        ];

        const actionbar = new UIActionbar(
            items,
            new SpriteBackground(sprites2.stone_slate_background_2x),
            UIActionbarAlignment.Left,
            {
                width: fillUiSize,
                height: fillUiSize,
            }
        );
        const masterView = this.getMasterView(meleeSkills);
        const detailsView = this.getDetailsView(0);

        this._masterDetailsView = new UIBookLayout();
        this._masterDetailsView.leftPage = masterView;
        this._masterDetailsView.rightPage = detailsView;
        this._masterDetailsView.setTabs(this.getTabs(0));

        const contentView = uiBox({
            id: "characterSkillsLayout",
            width: fillUiSize,
            height: fillUiSize,
            padding: allSides(64),
            alignment: uiAlignment.center,
            children: [this._masterDetailsView],
        });

        this.view = new UIActionbarScaffold(contentView, actionbar, null, {
            width: fillUiSize,
            height: fillUiSize,
        });
    }

    private tabSelected(index: number) {
        this._masterDetailsView.setTabs(this.getTabs(index));

        const masterView = this.getMasterView(meleeSkills);
        this._masterDetailsView.leftPage = masterView;
    }

    private getTabs(selectedTab: number): UIBookLayoutTab[] {
        return [
            {
                icon: sprites2.sword_skill,
                isSelected: selectedTab == 0,
                onTap: (index) => {
                    this.tabSelected(index);
                },
            },
            {
                icon: sprites2.worker_skill,
                isSelected: selectedTab == 1,
                onTap: (index) => {
                    this.tabSelected(index);
                },
            },
            {
                icon: sprites2.archer_skill,
                isSelected: selectedTab == 2,
                onTap: (index) => {
                    this.tabSelected(index);
                },
            },
            {
                icon: sprites2.wizard_hat_skill,
                isSelected: selectedTab == 3,
                onTap: (index) => {
                    this.tabSelected(index);
                },
            },
        ];
    }

    private getMasterView(skillCategory: SkillTree): UIView {
        return uiBox({
            width: fillUiSize,
            height: fillUiSize,
            alignment: uiAlignment.topLeft,
            padding: {
                left: 40,
                right: 32,
                top: 32,
                bottom: 48,
            },
            children: [new UISkillCategoryTree(skillCategory)],
        });
    }

    private getDetailsView(index: number): UIView {
        return uiBox({
            width: 300,
            height: 400,
            padding: {
                bottom: 32,
                left: 24,
                top: 32,
                right: 40,
            },
            children: [
                uiText({
                    padding: symmetricSides(0, 8),
                    text: "Skill details",
                    style: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 20,
                    },
                    width: fillUiSize,
                    height: wrapUiSize,
                }),
            ],
        });
    }
}
