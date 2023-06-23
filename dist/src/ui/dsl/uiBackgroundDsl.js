import { allSides } from "../../common/sides.js";
import { BoxBackground, ColorBackground, NinePatchBackground } from "../uiBackground.js";
export function colorBackground(color) {
    return new ColorBackground(color);
}
export function ninePatchBackground(properties) {
    return new NinePatchBackground(properties.sprite, properties.sides || allSides(8), properties.scale || 1);
}
export function boxBackground(properties) {
    let strokeWidth = 1;
    if (properties.strokeWidth != undefined) {
        strokeWidth = properties.strokeWidth;
    }
    return new BoxBackground(properties.fill, properties.stroke, strokeWidth);
}
