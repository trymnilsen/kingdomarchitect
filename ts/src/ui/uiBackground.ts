import { Sprite2 } from "../asset/sprite.js";
import { Point } from "../common/point.js";
import { allSides, Sides } from "../common/sides.js";
import { UIRenderScope } from "../rendering/uiRenderContext.js";
import { UISize } from "./uiSize.js";

export type UIBackground = {
    draw(context: UIRenderScope, screenPosition: Point, size: UISize): void;
};

export class ColorBackground implements UIBackground {
    constructor(private color: string) {}
    draw(context: UIRenderScope, screenPosition: Point, size: UISize): void {
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
    draw(context: UIRenderScope, screenPosition: Point, size: UISize): void {
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

    draw(context: UIRenderScope, screenPosition: Point, size: UISize): void {
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
    draw(context: UIRenderScope, screenPosition: Point): void {
        context.drawScreenSpaceSprite({
            sprite: this.sprite,
            x: screenPosition.x,
            y: screenPosition.y,
        });
    }
}

export function colorBackground(color: string): UIBackground {
    return new ColorBackground(color);
}

export type NinePatchBackgroundProperties = {
    sprite: Sprite2;
    sides?: Sides;
    scale?: number;
};

export function ninePatchBackground(
    properties: NinePatchBackgroundProperties,
): UIBackground {
    return new NinePatchBackground(
        properties.sprite,
        properties.sides ?? allSides(8),
        properties.scale ?? 1,
    );
}

export type BoxBackgroundProperties = {
    fill: string;
    stroke: string;
    strokeWidth?: number;
};
export function boxBackground(
    properties: BoxBackgroundProperties,
): UIBackground {
    let strokeWidth = 1;
    if (properties.strokeWidth != undefined) {
        strokeWidth = properties.strokeWidth;
    }

    return new BoxBackground(properties.fill, properties.stroke, strokeWidth);
}
