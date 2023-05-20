import { sprites2 } from "../../../../asset/sprite";
import { Bounds, zeroBounds } from "../../../../common/bounds";
import { Point, addPoint, zeroPoint } from "../../../../common/point";
import { Skill, SkillCategory, SkillTree } from "../../../../data/skill/skill";
import { skills } from "../../../../data/skill/skills";
import { UIRenderContext } from "../../../../rendering/uiRenderContext";
import { UILayoutContext } from "../../../../ui/uiLayoutContext";
import { UISize } from "../../../../ui/uiSize";
import { UIView } from "../../../../ui/uiView";

export class UISkillTree extends UIView {
    private scrollTranslation: Point = {
        x: -16,
        y: -16,
    };
    private halfWidth: number = 0;
    private halfHeight: number = 0;
    private drawBounds: Bounds = zeroBounds();

    panView(movement: Point) {
        this.scrollTranslation.x += movement.x;
        this.scrollTranslation.y += movement.y;
    }

    hitTest(screenPoint: Point): boolean {
        return true;
    }
    layout(layoutContext: UILayoutContext, constraints: UISize): UISize {
        this._measuredSize = {
            width: constraints.width,
            height: constraints.height,
        };
        this.halfWidth = constraints.width / 2;
        this.halfHeight = constraints.height / 2;
        this.drawBounds = {
            x1: 2,
            y1: 2,
            x2: this._measuredSize.width - 2,
            y2: this._measuredSize.height - 2,
        };
        return this._measuredSize;
    }

    draw(context: UIRenderContext): void {
        const bounds = {
            x1: this.screenPosition.x + this.drawBounds.x1,
            y1: this.screenPosition.y + this.drawBounds.y1,
            x2: this.screenPosition.x + this.drawBounds.x2,
            y2: this.screenPosition.y + this.drawBounds.y2,
        };

        context.drawWithClip(bounds, (clippedContext) => {
            const screenPositionWithScrollTranslation = addPoint(
                this.scrollTranslation,
                this.screenPosition
            );

            this.drawSkillCategory(
                clippedContext,
                screenPositionWithScrollTranslation,
                skills.magic,
                SkillCategory.Magic
            );
            this.drawSkillCategory(
                clippedContext,
                screenPositionWithScrollTranslation,
                skills.melee,
                SkillCategory.Melee
            );
            this.drawSkillCategory(
                clippedContext,
                screenPositionWithScrollTranslation,
                skills.productivity,
                SkillCategory.Productivity
            );
            this.drawSkillCategory(
                clippedContext,
                screenPositionWithScrollTranslation,
                skills.ranged,
                SkillCategory.Ranged
            );

            clippedContext.drawScreenSpaceRectangle({
                x: screenPositionWithScrollTranslation.x,
                y: screenPositionWithScrollTranslation.y,
                fill: "red",
                width: 8,
                height: 8,
            });
        });
    }

    override onTapDown(screenPoint: Point): boolean {
        return true;
    }

    private drawSkillCategory(
        context: UIRenderContext,
        screenPositionWithScrollTranslation: Point,
        skills: SkillTree,
        category: SkillCategory
    ) {
        for (let tierIndex = 0; tierIndex < skills.length; tierIndex++) {
            const skillTier = skills[tierIndex];
            for (
                let skillIndex = 0;
                skillIndex < skillTier.length;
                skillIndex++
            ) {
                const skillEntry = skillTier[skillIndex];
                const skillPosition = this.getItemPosition(
                    category,
                    tierIndex,
                    skillIndex,
                    skillTier.length
                );

                const offsetPosition = addPoint(
                    screenPositionWithScrollTranslation,
                    skillPosition
                );

                context.drawScreenSpaceSprite({
                    sprite: sprites2.fancy_wood_background,
                    x: offsetPosition.x,
                    y: offsetPosition.y,
                });

                context.drawScreenSpaceSprite({
                    sprite: skillEntry.asset,
                    x: offsetPosition.x + 7,
                    y: offsetPosition.y + 7,
                });
            }
        }
    }

    private getItemPosition(
        category: SkillCategory,
        depth: number,
        index: number,
        numberOfIndexes: number
    ): Point {
        const halfOfNumberOfIndexSize =
            (numberOfIndexes / 2) * itemPositionIndexSize;
        const mainAxis =
            depth * itemPositionIndexSize + halfItemPositionIndexSize;
        const crossAxis =
            index * itemPositionIndexSize - halfOfNumberOfIndexSize;

        switch (category) {
            case SkillCategory.Melee:
                return {
                    x: mainAxis * -1 - itemPositionIndexSize,
                    y: crossAxis,
                };
            case SkillCategory.Productivity:
                return {
                    x: mainAxis,
                    y: crossAxis,
                };
            case SkillCategory.Magic:
                return {
                    x: crossAxis,
                    y: mainAxis * -1 - itemPositionIndexSize,
                };
            case SkillCategory.Ranged:
                return {
                    x: crossAxis,
                    y: mainAxis,
                };
            default:
                throw new Error(`Unknown category ${category}`);
        }
    }
}

const itemPositionIndexSize = 64;
const halfItemPositionIndexSize = itemPositionIndexSize / 2;
