import { assets } from "../asset/assets";
import { Point } from "../common/point";
import { Sides } from "../common/sides";
import { UIRenderContext } from "../rendering/uiRenderContext";
import { UISize } from "./uiSize";

export interface UIBackground {
    draw(context: UIRenderContext, screenPosition: Point, size: UISize): void;
}

export class ColorBackground implements UIBackground {
    constructor(private color: string) {}
    draw(context: UIRenderContext, screenPosition: Point, size: UISize): void {
        context.drawScreenSpaceRectangle({
            x: screenPosition.x,
            y: screenPosition.y,
            width: size.width,
            height: size.height,
            fill: this.color,
        });
    }
}

export class NinePatchBackground implements UIBackground {
    constructor(
        private asset: keyof typeof assets,
        private sides: Sides,
        private scale: number
    ) {}
    draw(context: UIRenderContext, screenPosition: Point, size: UISize): void {
        context.drawNinePatchImage({
            x: screenPosition.x,
            y: screenPosition.y,
            width: size.width,
            height: size.height,
            asset: this.asset,
            scale: this.scale,
            sides: this.sides,
        });
    }
}
