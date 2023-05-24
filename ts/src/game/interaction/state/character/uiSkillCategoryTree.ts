import { sprites2 } from "../../../../asset/sprite";
import { allSides } from "../../../../common/sides";
import { SkillTree } from "../../../../data/skill/skill";
import { colorBackground } from "../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { uiButton } from "../../../../ui/dsl/uiButtonDsl";
import { ColumnChild, uiColumn } from "../../../../ui/dsl/uiColumnDsl";
import { uiImage } from "../../../../ui/dsl/uiImageDsl";
import { RowChild, uiRow } from "../../../../ui/dsl/uiRowDsl";
import { HorizontalAlignment } from "../../../../ui/uiAlignment";
import { SpriteBackground } from "../../../../ui/uiBackground";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize";
import { UIBox } from "../../../../ui/view/uiBox";
import { UISpriteImageSource } from "../../../../ui/view/uiImageSource";

export class UISkillCategoryTree extends UIBox {
    constructor(private skills: SkillTree) {
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
                                image: new UISpriteImageSource(sprites2.knight),
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
}
