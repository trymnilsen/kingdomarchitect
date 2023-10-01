import { Sprite2 } from "../../asset/sprite.js";
import { Point } from "../../common/point.js";
import { UIRenderContext } from "../../rendering/uiRenderContext.js";
import { UILayoutContext } from "../uiLayoutContext.js";
import { UISize } from "../uiSize.js";

export type UIImageSource = {
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
