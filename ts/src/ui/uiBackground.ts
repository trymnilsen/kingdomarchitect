import { Sprite2 } from "../asset/sprite.js";
import { Point } from "../common/point.js";
import { Sides } from "../common/sides.js";
import { UIRenderContext } from "../rendering/uiRenderContext.js";
import { UISize } from "./uiSize.js";

export type UIBackground = {
    draw(context: UIRenderContext, screenPosition: Point, size: UISize): void;
};

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
        private sprite: Sprite2,
        private sides: Sides,
        private scale: number,
    ) {}
    draw(context: UIRenderContext, screenPosition: Point, size: UISize): void {
        context.drawNinePatchSprite({
            x: screenPosition.x,
            y: screenPosition.y,
            width: size.width,
            height: size.height,
            sprite: this.sprite,
            scale: this.scale,
            sides: this.sides,
        });
    }
}

export class BoxBackground implements UIBackground {
    constructor(
        private fill: string,
        private stroke: string,
        private strokeWidth: number,
    ) {}

    draw(context: UIRenderContext, screenPosition: Point, size: UISize): void {
        context.drawScreenSpaceRectangle({
            x: screenPosition.x,
            y: screenPosition.y,
            width: size.width,
            height: size.height,
            fill: this.fill,
            strokeColor: this.stroke,
            strokeWidth: this.strokeWidth,
        });
    }
}

export class SpriteBackground implements UIBackground {
    constructor(private sprite: Sprite2) {}
    draw(context: UIRenderContext, screenPosition: Point): void {
        context.drawScreenSpaceSprite({
            sprite: this.sprite,
            x: screenPosition.x,
            y: screenPosition.y,
        });
    }
}
