import { characterPartFrames } from "../../generated/characterFrames.js";
import type { RenderScope } from "../rendering/renderScope.js";
import type { Sprite2 } from "../asset/sprite.js";

const CHARACTER_FRAME_WIDTH = 16;
const CHARACTER_FRAME_HEIGHT = 16;

/**
 * Color mapping for different body parts
 */
const getPartColor = (partName: string, chestColor: string): string => {
    if (partName === "LeftEye" || partName === "RightEye") {
        return "#000000"; // Eyes are black
    } else if (partName === "Chest") {
        return chestColor; // Chest uses custom color
    } else {
        return "#FACBA6"; // Default skin color for other parts
    }
};

/**
 * Calculate total number of frames across all animations
 */
const getTotalFrameCount = (): number => {
    let totalFrames = 0;
    for (const animation of characterPartFrames) {
        if (animation.parts.length > 0) {
            totalFrames += animation.parts[0].frames.length;
        }
    }
    return totalFrames;
};

/**
 * Builds a sprite sheet for a character with the given customization
 * @param scope The render scope to use for drawing
 * @param chestColor The color to use for the chest part
 * @returns A Sprite2 object representing the generated sprite sheet
 */
export function buildSpriteSheet(
    scope: RenderScope,
    chestColor: string,
): Sprite2 {
    const totalFrames = getTotalFrameCount();

    // Create canvas that fits all frames in a horizontal strip
    const canvasWidth = CHARACTER_FRAME_WIDTH * totalFrames;
    const canvasHeight = CHARACTER_FRAME_HEIGHT;
    const offscreenScope = scope.getOffscreenRenderScope(
        canvasWidth,
        canvasHeight,
    );

    let currentFrameIndex = 0;

    // Iterate through all animations and their frames
    for (const animation of characterPartFrames) {
        // Get the number of frames from the first part (all parts have same frame count)
        const frameCount = animation.parts[0]?.frames.length || 0;

        for (let frameIdx = 0; frameIdx < frameCount; frameIdx++) {
            const xOffset = currentFrameIndex * CHARACTER_FRAME_WIDTH;

            // Draw all parts for this frame
            for (const part of animation.parts) {
                const frameData = part.frames[frameIdx];
                if (!frameData || frameData.length === 0) {
                    continue; // Skip empty frames
                }

                const color = getPartColor(part.partName, chestColor);

                // Draw each pixel in the frame data
                // Frame data is [x1, y1, x2, y2, x3, y3, ...]
                for (let i = 0; i < frameData.length; i += 2) {
                    const x = frameData[i];
                    const y = frameData[i + 1];

                    offscreenScope.drawScreenSpaceRectangle({
                        x: xOffset + x,
                        y: y,
                        width: 1,
                        height: 1,
                        fill: color,
                    });
                }
            }

            currentFrameIndex++;
        }
    }

    // Get the generated bitmap and store it in the asset loader
    const bitmap = offscreenScope.getBitmap();
    const binName = "character-generated";
    scope.assetLoader.addGeneratedAsset(binName, bitmap);

    // Create a Sprite2 object for the generated sprite sheet
    const sprite: Sprite2 = {
        bin: binName,
        id: `character-${chestColor.replace("#", "")}`,
        defintion: {
            frames: totalFrames,
            w: CHARACTER_FRAME_WIDTH,
            h: CHARACTER_FRAME_HEIGHT,
            x: 0,
            y: 0,
        },
    };

    return sprite;
}
