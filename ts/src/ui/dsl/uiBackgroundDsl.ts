import { ImageAsset } from "../../asset/assets";
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
    asset: ImageAsset;
    sides?: Sides;
    scale?: number;
}

export function ninePatchBackground(
    properties: NinePatchBackgroundProperties
): UIBackground {
    return new NinePatchBackground(
        properties.asset,
        properties.sides || allSides(8),
        properties.scale || 1
    );
}
