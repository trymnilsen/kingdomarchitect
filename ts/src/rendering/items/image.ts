import { ImageAsset } from "../../asset/assets";
import { Sprite } from "../../asset/sprite";
import { Bounds } from "../../common/bounds";
import { Sides } from "../../common/sides";
import { RenderItemConfiguration } from "./renderItemConfiguration";

export interface ImageConfiguration extends RenderItemConfiguration {
    image: ImageAsset;
}

export interface SpriteConfiguration extends RenderItemConfiguration {
    sprite: Sprite;
}

export function imageSizeRenderer(
    x: number,
    y: number,
    width: number,
    height: number,
    image: HTMLImageElement,
    context: CanvasRenderingContext2D
) {
    context.drawImage(image, x, y, width, height);
}

export function imageRenderer(
    x: number,
    y: number,
    scale: number,
    image: HTMLImageElement,
    context: CanvasRenderingContext2D
) {
    if (scale == 1) {
        context.drawImage(image, x, y);
    } else {
        context.drawImage(
            image,
            x,
            y,
            image.width * scale,
            image.height * scale
        );
    }
}

export interface NinePatchImageConfiguration extends RenderItemConfiguration {
    asset: ImageAsset;
    sides: Sides;
    width: number;
    height: number;
    scale: number;
}

export function spriteRenderer(
    x: number,
    y: number,
    bounds: Bounds,
    image: HTMLImageElement,
    context: CanvasRenderingContext2D
) {
    x = Math.floor(x);
    y = Math.floor(y);

    const width = bounds.x2 - bounds.x1;
    const height = bounds.y2 - bounds.y1;
    context.drawImage(
        image,
        bounds.x1,
        bounds.y1,
        width,
        height,
        x,
        y,
        width,
        height
    );
}

export function ninePatchImageRenderer(
    x: number,
    y: number,
    width: number,
    height: number,
    top: number,
    bottom: number,
    left: number,
    right: number,
    scale: number,
    image: HTMLImageElement,
    context: CanvasRenderingContext2D
) {
    x = Math.floor(x);
    y = Math.floor(y);
    width = Math.floor(width);
    height = Math.floor(height);

    const patchWidth = image.width;
    const patchHeight = image.height;
    const middlePatchWidth = patchWidth - left - right;
    const middlePatchHeight = patchHeight - top - bottom;

    const leftScaled = Math.floor(left * scale);
    const rightScaled = Math.floor(right * scale);
    const topScaled = Math.floor(top * scale);
    const bottomScaled = Math.floor(bottom * scale);

    const middleScaledWidth = Math.max(width - leftScaled - rightScaled, 0);
    const middleScaledHeight = Math.max(height - topScaled - bottomScaled, 0);

    // Draw top left part of the patch
    context.drawImage(image, 0, 0, left, top, x, y, leftScaled, topScaled);

    // Draw top right part of the patch
    context.drawImage(
        image,
        patchWidth - right,
        0,
        right,
        top,
        x + width - rightScaled,
        y,
        rightScaled,
        topScaled
    );

    // Draw bottom left part of the patch
    context.drawImage(
        image,
        0,
        patchHeight - bottom,
        left,
        bottom,
        x,
        y + height - bottomScaled,
        leftScaled,
        bottomScaled
    );

    // Draw bottom right part of the patch
    context.drawImage(
        image,
        patchWidth - right,
        patchHeight - bottom,
        right,
        bottom,
        x + width - rightScaled,
        y + height - bottomScaled,
        rightScaled,
        bottomScaled
    );

    if (middleScaledHeight > 0) {
        // Draw the left middle part
        context.drawImage(
            image,
            0,
            top,
            left,
            middlePatchHeight,
            x,
            y + topScaled,
            leftScaled,
            middleScaledHeight
        );

        // Draw the right middle part
        context.drawImage(
            image,
            patchWidth - right,
            top,
            right,
            middlePatchHeight,
            x + width - rightScaled,
            y + topScaled,
            rightScaled,
            middleScaledHeight
        );
    }

    if (middleScaledWidth > 0) {
        // Draw the top middle part
        context.drawImage(
            image,
            left,
            0,
            middlePatchWidth,
            top,
            x + leftScaled,
            y,
            middleScaledWidth,
            topScaled
        );

        // Draw the bottom middle part
        context.drawImage(
            image,
            left,
            patchHeight - bottom,
            middlePatchWidth,
            bottom,
            x + leftScaled,
            y + height - bottomScaled,
            middleScaledWidth,
            bottomScaled
        );
    }

    // Draw the middle part
    context.drawImage(
        image,
        left,
        top,
        middlePatchWidth,
        middlePatchHeight,
        x + leftScaled,
        y + topScaled,
        middleScaledWidth,
        middleScaledHeight
    );
}
