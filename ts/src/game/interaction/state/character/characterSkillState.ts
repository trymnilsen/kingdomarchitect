import { wrap } from "module";
import { sprites2 } from "../../../../module/asset/sprite.js";
import { allSides, symmetricSides } from "../../../../common/sides.js";
import { magicSkills } from "../../../../data/skill/magic.js";
import { meleeSkills } from "../../../../data/skill/melee.js";
import { productivitySkills } from "../../../../data/skill/productivity.js";
import { rangedSkills } from "../../../../data/skill/ranged.js";
import {
    Skill,
    SkillCategory,
    SkillTree,
} from "../../../../data/skill/skill.js";
import { bookInkColor } from "../../../../module/ui/color.js";
import { uiBox } from "../../../../module/ui/dsl/uiBoxDsl.js";
import { uiColumn } from "../../../../module/ui/dsl/uiColumnDsl.js";
import { uiRow } from "../../../../module/ui/dsl/uiRowDsl.js";
import { uiText } from "../../../../module/ui/dsl/uiTextDsl.js";
import {
    HorizontalAlignment,
    VerticalAlignment,
    uiAlignment,
} from "../../../../module/ui/uiAlignment.js";
import { fillUiSize, wrapUiSize } from "../../../../module/ui/uiSize.js";
import { UIView } from "../../../../module/ui/uiView.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarItem } from "../../view/actionbar/uiActionbar.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
import {
    UIBookLayout,
    UIBookLayoutPage,
    UIBookLayoutTab,
} from "../../view/uiBookLayout.js";
import { UISkillCategoryTree } from "./uiSkillCategoryTree.js";
import { SpriteBackground } from "../../../../module/ui/uiBackground.js";
import { uiImage } from "../../../../module/ui/dsl/uiImageDsl.js";
import { UISpriteImageSource } from "../../../../module/ui/view/uiImageSource.js";
import { colorBackground } from "../../../../module/ui/dsl/uiBackgroundDsl.js";

export class CharacterSkillState extends InteractionState {
    private _masterDetailsView: UIBookLayout;
    private _activeSkillTree: SkillTree;

    override get isModal(): boolean {
        return true;
    }

    override get stateName(): string {
        return "Skills";
    }

    constructor() {
        super();
        this._activeSkillTree = meleeSkills;
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

        const masterView = this.getMasterView(meleeSkills, SkillCategory.Melee);
        const detailsView = this.getDetailsView(meleeSkills[0][0]);

        this._masterDetailsView = new UIBookLayout();
        this._masterDetailsView.leftPage = masterView;
        this._masterDetailsView.rightPage = detailsView;
        this._masterDetailsView.setTabs(this.getTabs(0));

        const contentView = uiBox({
            id: "characterSkillsLayout",
            width: fillUiSize,
            height: fillUiSize,
            //padding: allSides(64),
            alignment: uiAlignment.center,
            children: [this._masterDetailsView],
        });

        this.view = new UIActionbarScaffold(contentView, items, [], {
            width: fillUiSize,
            height: fillUiSize,
        });
    }

    private tabSelected(index: number) {
        this._masterDetailsView.setTabs(this.getTabs(index));
        const skillTree = this.getSkillTree(index);
        const category = this.getSkillCategory(index);
        const masterView = this.getMasterView(skillTree, category);
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

    private getSkillTree(tabIndex: number): SkillTree {
        switch (tabIndex) {
            case 1:
                return productivitySkills;
            case 2:
                return rangedSkills;
            case 3:
                return magicSkills;
            default:
                return meleeSkills;
        }
    }

    private getSkillCategory(tabIndex: number): SkillCategory {
        switch (tabIndex) {
            case 1:
                return SkillCategory.Productivity;
            case 2:
                return SkillCategory.Ranged;
            case 3:
                return SkillCategory.Magic;
            default:
                return SkillCategory.Melee;
        }
    }

    private getMasterView(
        skillTree: SkillTree,
        category: SkillCategory,
    ): UIView {
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
            children: [
                new UISkillCategoryTree(skillTree, category, (skill) => {
                    this.skillSelected(skill);
                }),
            ],
        });
    }

    private getDetailsView(skill: Skill): UIView {
        const header = this.getSkillDetailsHeader(skill);
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
                uiColumn({
                    horizontalAlignment: HorizontalAlignment.Left,
                    height: fillUiSize,
                    width: fillUiSize,
                    children: [
                        {
                            child: header,
                        },
                        {
                            child: uiText({
                                id: "skill-name",
                                width: wrapUiSize,
                                height: wrapUiSize,
                                padding: symmetricSides(0, 8),
                                text: "Description with a long name. Maybe this will be on a new line or maybe thisverylongname will be on its own little line. Lets see what ends up in the UI.",
                                style: {
                                    color: bookInkColor,
                                    font: "Silkscreen",
                                    size: 20,
                                },
                            }),
                        },
                    ],
                }),
            ],
        });
    }

    private getSkillDetailsHeader(skill: Skill): UIView {
        return uiRow({
            width: fillUiSize,
            height: wrapUiSize,
            verticalAlignment: VerticalAlignment.Center,
            children: [
                {
                    child: uiBox({
                        width: wrapUiSize,
                        height: wrapUiSize,
                        padding: allSides(8),
                        children: [
                            uiBox({
                                width: 48,
                                height: 48,
                                background: new SpriteBackground(
                                    sprites2.fancy_wood_background,
                                ),
                                children: [
                                    uiImage({
                                        width: 32,
                                        height: 32,
                                        image: new UISpriteImageSource(
                                            skill.asset,
                                        ),
                                    }),
                                ],
                            }),
                        ],
                    }),
                },
                {
                    weight: 1,
                    child: uiText({
                        id: "skill-name",
                        width: fillUiSize,
                        height: wrapUiSize,
                        padding: symmetricSides(0, 8),
                        text: skill.name,
                        style: {
                            color: bookInkColor,
                            font: "Silkscreen",
                            size: 20,
                        },
                    }),
                },
            ],
        });
    }

    private skillSelected(skill: Skill) {
        this._masterDetailsView.rightPage = this.getDetailsView(skill);
        this._masterDetailsView.currentPage = UIBookLayoutPage.Right;
    }
}
