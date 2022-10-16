import { ImageAsset } from "../../asset/assets";
import { Sprite } from "../../asset/sprite";
import { Point } from "../../common/point";
import { UIRenderContext } from "../../rendering/uiRenderContext";
import { UILayoutContext } from "../uiLayoutContext";
import { UISize } from "../uiView";

export interface UIImageSource {
    measure(layoutContext: UILayoutContext): UISize;
    draw(context: UIRenderContext, screenposition: Point, size: UISize): void;
}

export class UISpriteImageSource implements UIImageSource {
    constructor(private sprite: Sprite) {}
    measure(layoutContext: UILayoutContext): UISize {
        return layoutContext.measureSprite(this.sprite);
    }
    draw(context: UIRenderContext, screenposition: Point, size: UISize): void {
        context.drawScreenSpaceSprite({
            sprite: this.sprite,
            x: screenposition.x,
            y: screenposition.y,
        });
    }
}

export class UIAssetImageSource implements UIImageSource {
    constructor(private asset: ImageAsset) {}
    measure(layoutContext: UILayoutContext): UISize {
        return layoutContext.measureImage(this.asset);
    }
    draw(context: UIRenderContext, screenposition: Point, size: UISize): void {
        context.drawScreenSpaceImage(
            {
                image: this.asset,
                x: screenposition.x,
                y: screenposition.y,
            },
            1
        );
    }
}
