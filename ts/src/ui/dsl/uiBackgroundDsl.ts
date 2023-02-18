import { Sprite2 } from "../../asset/sprite";
import { allSides, Sides } from "../../common/sides";
import {
    ColorBackground,
    NinePatchBackground,
    UIBackground,
} from "../uiBackground";

export function colorBackground(color: string): UIBackground {
    return new ColorBackground(color);
}

export interface NinePatchBackgroundProperties {
    sprite: Sprite2;
    sides?: Sides;
    scale?: number;
}

export function ninePatchBackground(
    properties: NinePatchBackgroundProperties
): UIBackground {
    return new NinePatchBackground(
        properties.sprite,
        properties.sides || allSides(8),
        properties.scale || 1
    );
}
