import { Sprite2 } from "../../asset/sprite.js";
import { Point } from "../../common/point.js";
import { UIRenderScope } from "../../rendering/uiRenderContext.js";
import { UILayoutScope } from "../uiLayoutContext.js";
import { UISize } from "../uiSize.js";

export type UIImageSource = {
    measure(layoutContext: UILayoutScope): UISize;
    draw(context: UIRenderScope, screenposition: Point, size: UISize): void;
};

export class UISpriteImageSource implements UIImageSource {
    constructor(private sprite: Sprite2) {}
    measure(layoutContext: UILayoutScope): UISize {
        return layoutContext.measureSprite(this.sprite);
    }
    draw(context: UIRenderScope, screenposition: Point, size: UISize): void {
        context.drawScreenSpaceSprite({
            sprite: this.sprite,
            x: screenposition.x,
            y: screenposition.y,
            targetWidth: size.width,
            targetHeight: size.height,
        });
    }
}
