import type { SpriteRef } from "../asset/sprite.ts";
import { Point } from "../common/point.ts";
import { allSides, Sides } from "../common/sides.ts";
import { UIRenderScope } from "../rendering/uiRenderContext.ts";
import { UISize } from "./uiSize.ts";

export type UIBackground = {
    draw(context: UIRenderScope, screenPosition: Point, size: UISize): void;
};

export class ColorBackground implements UIBackground {
    private color: string;

    constructor(color: string) {
        this.color = color;
    }

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
    private sprite: SpriteRef;
    private sides: Sides;
    private scale: number;

    constructor(sprite: SpriteRef, sides: Sides, scale: number) {
        this.sprite = sprite;
        this.sides = sides;
        this.scale = scale;
    }

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
    private fill: string;
    private stroke: string;
    private strokeWidth: number;

    constructor(fill: string, stroke: string, strokeWidth: number) {
        this.fill = fill;
        this.stroke = stroke;
        this.strokeWidth = strokeWidth;
    }

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
    private sprite: SpriteRef;

    constructor(sprite: SpriteRef) {
        this.sprite = sprite;
    }

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
    sprite: SpriteRef;
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
