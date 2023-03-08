import { sprites2 } from "../../../../asset/sprite";
import { Bounds, zeroBounds } from "../../../../common/bounds";
import { addPoint, Point } from "../../../../common/point";
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
            x1: this.screenPosition.x + 2,
            y1: this.screenPosition.y + 2,
            x2: this.screenPosition.x + this._measuredSize.width - 2,
            y2: this.screenPosition.y + this._measuredSize.height - 2,
        };
        return this._measuredSize;
    }

    draw(context: UIRenderContext): void {
        context.drawWithClip(this.drawBounds, (clippedContext) => {
            const itemOffset = addPoint(
                addPoint(this.scrollTranslation, this.screenPosition),
                {
                    x: this.halfWidth,
                    y: this.halfHeight,
                }
            );

            clippedContext.drawScreenSpaceSprite({
                sprite: sprites2.fancy_wood_background,
                x: itemOffset.x - 8,
                y: itemOffset.y - 8,
            });

            clippedContext.drawScreenSpaceSprite({
                sprite: sprites2.worker,
                x: itemOffset.x,
                y: itemOffset.y,
            });

            const knightOffset = addPoint(itemOffset, {
                x: -64,
                y: 0,
            });

            const workerOffset = addPoint(itemOffset, {
                x: 64,
                y: 0,
            });

            const wizardOffset = addPoint(itemOffset, {
                x: 0,
                y: -64,
            });
            const archerOffset = addPoint(itemOffset, {
                x: 0,
                y: 64,
            });

            clippedContext.drawScreenSpaceSprite({
                sprite: sprites2.fancy_wood_background,
                x: knightOffset.x - 8,
                y: knightOffset.y - 8,
            });

            clippedContext.drawScreenSpaceSprite({
                sprite: sprites2.sword_skill,
                x: knightOffset.x,
                y: knightOffset.y,
            });

            clippedContext.drawScreenSpaceSprite({
                sprite: sprites2.fancy_wood_background,
                x: workerOffset.x - 8,
                y: workerOffset.y - 8,
            });

            clippedContext.drawScreenSpaceSprite({
                sprite: sprites2.worker_skill,
                x: workerOffset.x,
                y: workerOffset.y,
            });

            clippedContext.drawScreenSpaceSprite({
                sprite: sprites2.fancy_wood_background,
                x: wizardOffset.x - 8,
                y: wizardOffset.y - 8,
            });

            clippedContext.drawScreenSpaceSprite({
                sprite: sprites2.wizard_hat_skill,
                x: wizardOffset.x,
                y: wizardOffset.y,
            });

            clippedContext.drawScreenSpaceSprite({
                sprite: sprites2.fancy_wood_background,
                x: archerOffset.x - 8,
                y: archerOffset.y - 8,
            });

            clippedContext.drawScreenSpaceSprite({
                sprite: sprites2.archer_skill,
                x: archerOffset.x,
                y: archerOffset.y,
            });
        });
    }

    override onTapDown(screenPoint: Point): boolean {
        return true;
    }
}
