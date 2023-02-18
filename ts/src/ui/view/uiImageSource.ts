import { Sprite2 } from "../../asset/sprite";
import { Point } from "../../common/point";
import { UIRenderContext } from "../../rendering/uiRenderContext";
import { UILayoutContext } from "../uiLayoutContext";
import { UISize } from "../uiSize";

export interface UIImageSource {
    measure(layoutContext: UILayoutContext): UISize;
    draw(context: UIRenderContext, screenposition: Point, size: UISize): void;
}

export class UISpriteImageSource implements UIImageSource {
    constructor(private sprite: Sprite2) {}
    measure(layoutContext: UILayoutContext): UISize {
        return layoutContext.measureSprite(this.sprite);
    }
    draw(context: UIRenderContext, screenposition: Point, size: UISize): void {
        context.drawScreenSpaceSprite({
            sprite: this.sprite,
            x: screenposition.x,
            y: screenposition.y,
            targetWidth: size.width,
            targetHeight: size.height,
        });
    }
}
