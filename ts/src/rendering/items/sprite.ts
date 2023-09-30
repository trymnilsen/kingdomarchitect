import { Sprite2 } from "../../asset/sprite.js";
import { Sides } from "../../common/sides.js";
import { RenderItemConfiguration } from "./renderItemConfiguration.js";

export type SpriteConfiguration = {
    sprite: Sprite2;
    frame?: number;
    targetWidth?: number;
    targetHeight?: number;
} & RenderItemConfiguration

export type NinePatchSpriteConfiguration = {
    sprite: Sprite2;
    sides: Sides;
    width: number;
    height: number;
    scale: number;
} & RenderItemConfiguration

export function spriteRenderer(
    x: number,
    y: number,
    sourceX: number,
    sourceY: number,
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    frame: number,
    binAsset: HTMLImageElement,
    context: CanvasRenderingContext2D,
) {
    x = Math.floor(x);
    y = Math.floor(y);
    let sourceXWithOffset = sourceX;

    if (frame > 0) {
        sourceXWithOffset = sourceX + frame * sourceWidth;
    }

    context.drawImage(
        binAsset,
        sourceXWithOffset,
        sourceY,
        sourceWidth,
        sourceHeight,
        x,
        y,
        targetWidth,
        targetHeight,
    );
}

/**
 * Draws a sprite as a ninePatch/NineSlice
 * @param x
 * @param y
 * @param sourceX
 * @param sourceY
 * @param sourceWidth
 * @param sourceHeight
 * @param width
 * @param height
 * @param top
 * @param bottom
 * @param left
 * @param right
 * @param scale
 * @param binAsset
 * @param context
 */
export function ninePatchImageRenderer(
    x: number,
    y: number,
    sourceX: number,
    sourceY: number,
    sourceWidth: number,
    sourceHeight: number,
    width: number,
    height: number,
    top: number,
    bottom: number,
    left: number,
    right: number,
    scale: number,
    binAsset: HTMLImageElement,
    context: CanvasRenderingContext2D,
) {
    x = Math.floor(x);
    y = Math.floor(y);
    width = Math.floor(width);
    height = Math.floor(height);

    const patchWidth = sourceWidth;
    const patchHeight = sourceHeight;
    const middlePatchWidth = patchWidth - left - right;
    const middlePatchHeight = patchHeight - top - bottom;

    const leftScaled = Math.floor(left * scale);
    const rightScaled = Math.floor(right * scale);
    const topScaled = Math.floor(top * scale);
    const bottomScaled = Math.floor(bottom * scale);

    const middleScaledWidth = Math.max(width - leftScaled - rightScaled, 0);
    const middleScaledHeight = Math.max(height - topScaled - bottomScaled, 0);

    // Draw top left part of the patch
    context.drawImage(
        binAsset,
        sourceX,
        sourceY,
        left,
        top,
        x,
        y,
        leftScaled,
        topScaled,
    );

    // Draw top right part of the patch
    context.drawImage(
        binAsset,
        sourceX + patchWidth - right,
        sourceY,
        right,
        top,
        x + width - rightScaled,
        y,
        rightScaled,
        topScaled,
    );

    // Draw bottom left part of the patch
    context.drawImage(
        binAsset,
        sourceX,
        sourceY + patchHeight - bottom,
        left,
        bottom,
        x,
        y + height - bottomScaled,
        leftScaled,
        bottomScaled,
    );

    // Draw bottom right part of the patch
    context.drawImage(
        binAsset,
        sourceX + patchWidth - right,
        sourceY + patchHeight - bottom,
        right,
        bottom,
        x + width - rightScaled,
        y + height - bottomScaled,
        rightScaled,
        bottomScaled,
    );

    if (middleScaledHeight > 0) {
        // Draw the left middle part
        context.drawImage(
            binAsset,
            sourceX,
            sourceY + top,
            left,
            middlePatchHeight,
            x,
            y + topScaled,
            leftScaled,
            middleScaledHeight,
        );

        // Draw the right middle part
        context.drawImage(
            binAsset,
            sourceX + patchWidth - right,
            sourceY + top,
            right,
            middlePatchHeight,
            x + width - rightScaled,
            y + topScaled,
            rightScaled,
            middleScaledHeight,
        );
    }

    if (middleScaledWidth > 0) {
        // Draw the top middle part
        context.drawImage(
            binAsset,
            sourceX + left,
            sourceY,
            middlePatchWidth,
            top,
            x + leftScaled,
            y,
            middleScaledWidth,
            topScaled,
        );

        // Draw the bottom middle part
        context.drawImage(
            binAsset,
            sourceX + left,
            sourceY + patchHeight - bottom,
            middlePatchWidth,
            bottom,
            x + leftScaled,
            y + height - bottomScaled,
            middleScaledWidth,
            bottomScaled,
        );
    }

    // Draw the middle part
    context.drawImage(
        binAsset,
        sourceX + left,
        sourceY + top,
        middlePatchWidth,
        middlePatchHeight,
        x + leftScaled,
        y + topScaled,
        middleScaledWidth,
        middleScaledHeight,
    );
}
