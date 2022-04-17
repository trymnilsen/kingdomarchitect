import { assets } from "../../asset/assets";
import { Bounds } from "../../common/bounds";
import { Sides } from "../../common/sides";
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

export interface NinePatchImageConfiguration extends RenderItemConfiguration {
    asset: keyof typeof assets;
    sides: Sides;
    width: number;
    height: number;
}

export function spriteRenderer(
    x: number,
    y: number,
    bounds: Bounds,
    image: HTMLImageElement,
    context: CanvasRenderingContext2D
) {}

export function ninePatchImageRenderer(
    x: number,
    y: number,
    width: number,
    height: number,
    top: number,
    bottom: number,
    left: number,
    right: number,
    image: HTMLImageElement,
    context: CanvasRenderingContext2D
) {
    /* - Draw topLeft rectangle
	- Draw topRight rectangle
	- Draw bottomLeft rectangle
	- Draw bottomRight rectangle
	- draw top border
	- draw left border
	- draw right border
	- draw bottom
	- draw middle */
    // Draw topLeft part of the patch
    context.drawImage(image, 0, 0, left, top, x, y, left, top);
    // Draw topRight part of the patch
    context.drawImage(
        image,
        image.width - right,
        0,
        right,
        top,
        x + width - right,
        y,
        right,
        top
    );
}
