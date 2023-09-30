import { Sprite2 } from "../../asset/sprite.js";
import { allSides, Sides } from "../../common/sides.js";
import {
    BoxBackground,
    ColorBackground,
    NinePatchBackground,
    UIBackground,
} from "../uiBackground.js";

export function colorBackground(color: string): UIBackground {
    return new ColorBackground(color);
}

export type NinePatchBackgroundProperties = {
    sprite: Sprite2;
    sides?: Sides;
    scale?: number;
}

export function ninePatchBackground(
    properties: NinePatchBackgroundProperties,
): UIBackground {
    return new NinePatchBackground(
        properties.sprite,
        properties.sides || allSides(8),
        properties.scale || 1,
    );
}

export type BoxBackgroundProperties = {
    fill: string;
    stroke: string;
    strokeWidth?: number;
}
export function boxBackground(
    properties: BoxBackgroundProperties,
): UIBackground {
    let strokeWidth = 1;
    if (properties.strokeWidth != undefined) {
        strokeWidth = properties.strokeWidth;
    }

    return new BoxBackground(properties.fill, properties.stroke, strokeWidth);
}
