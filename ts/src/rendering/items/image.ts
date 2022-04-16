import { assets } from "../../asset/assets";
import { RenderItemConfiguration } from "./renderItemConfiguration";

export interface ImageConfiguration extends RenderItemConfiguration {
    image: keyof typeof assets;
}

export function imageRenderer(
    x: number,
    y: number,
    image: HTMLImageElement,
    context: CanvasRenderingContext2D
) {
    context.drawImage(image, x, y);
}
