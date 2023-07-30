import { Sprite2, sprites2 } from "../../../../asset/sprite.js";
import { allSides } from "../../../../common/sides.js";
import {
    Skill,
    SkillCategory,
    SkillTree,
} from "../../../../data/skill/skill.js";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl.js";
import { uiButton } from "../../../../ui/dsl/uiButtonDsl.js";
import { ColumnChild, uiColumn } from "../../../../ui/dsl/uiColumnDsl.js";
import { uiImage } from "../../../../ui/dsl/uiImageDsl.js";
import { RowChild, uiRow } from "../../../../ui/dsl/uiRowDsl.js";
import { HorizontalAlignment } from "../../../../ui/uiAlignment.js";
import { SpriteBackground } from "../../../../ui/uiBackground.js";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.js";
import { UIBox } from "../../../../ui/view/uiBox.js";
import { UISpriteImageSource } from "../../../../ui/view/uiImageSource.js";

export class UISkillCategoryTree extends UIBox {
    constructor(
        private skills: SkillTree,
        private skillCategory: SkillCategory,
        private skillSelected: (skill: Skill) => void
    ) {
        super({
            width: fillUiSize,
            height: fillUiSize,
        });
        this.createCategoryItems();
        //this.background = colorBackground("red");
    }

    private createCategoryItems() {
        const skillTiers: ColumnChild[] = [];
        for (const skillTier of this.skills) {
            const rowItems: RowChild[] = [];
            for (const skill of skillTier) {
                const skillItem = uiBox({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    padding: allSides(8),
                    children: [
                        uiButton({
                            width: 48,
                            height: 48,
                            defaultBackground: new SpriteBackground(
                                sprites2.fancy_wood_background
                            ),
                            onTapCallback: () => {
                                this.skillSelected(skill);
                            },
                            children: [
                                uiImage({
                                    width: 32,
                                    height: 32,
                                    image: new UISpriteImageSource(skill.asset),
                                }),
                            ],
                        }),
                    ],
                });

                rowItems.push({
                    child: skillItem,
                });
            }

            const rowView = uiRow({
                children: rowItems,
                width: fillUiSize,
                height: wrapUiSize,
            });

            skillTiers.push({
                child: rowView,
            });
        }

        skillTiers.push({
            child: uiBox({
                width: wrapUiSize,
                height: wrapUiSize,
                padding: allSides(8),
                children: [
                    uiButton({
                        width: 48,
                        height: 48,
                        defaultBackground: new SpriteBackground(
                            sprites2.fancy_wood_background
                        ),
                        children: [
                            uiImage({
                                width: 32,
                                height: 32,
                                image: new UISpriteImageSource(
                                    this.getSkillWorkerStyle(this.skillCategory)
                                ),
                            }),
                        ],
                    }),
                ],
            }),
        });

        const skillView = uiColumn({
            height: wrapUiSize,
            width: fillUiSize,
            children: skillTiers,
            horizontalAlignment: HorizontalAlignment.Center,
        });

        this.addView(skillView);
    }

    private getSkillWorkerStyle(category: SkillCategory): Sprite2 {
        switch (category) {
            case SkillCategory.Magic:
                return sprites2.mage;
            case SkillCategory.Melee:
                return sprites2.knight;
            case SkillCategory.Productivity:
                return sprites2.worker;
            case SkillCategory.Ranged:
                return sprites2.bowman;
        }
    }
}
