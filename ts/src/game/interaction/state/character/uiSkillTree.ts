import { sprites2 } from "../../../../asset/sprite";
import { Bounds, zeroBounds } from "../../../../common/bounds";
import { addPoint, Point } from "../../../../common/point";
import { Skill, SkillTree } from "../../../../data/skill/skill";
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
            const itemOffset = addPoint(
                addPoint(this.scrollTranslation, this.screenPosition),
                {
                    x: this.halfWidth,
                    y: this.halfHeight,
                }
            );
        });
    }

    override onTapDown(screenPoint: Point): boolean {
        return true;
    }

    private drawSkillCategory(skills: SkillTree, scrollOffset: Point) {}

    private drawSkill(
        skill: Skill,
        scrollOffset: Point,
        depth: number,
        index: number
    ) {}
}
