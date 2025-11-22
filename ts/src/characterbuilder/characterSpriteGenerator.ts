import { characterPartFrames } from "../../generated/characterFrames.js";
import type { RenderScope } from "../rendering/renderScope.js";
import type { Sprite2 } from "../asset/sprite.js";
import type { CharacterColors } from "./colors.js";

const CHARACTER_FRAME_WIDTH = 16;
const CHARACTER_FRAME_HEIGHT = 16;

const defaultColor = "#FACBA6"; // Default skin color for other parts
export type PartNames =
    | "Head"
    | "Chest"
    | "Pants"
    | "LeftFoot"
    | "RightFoot"
    | "LeftHand"
    | "RightHand"
    | "LeftEye"
    | "RightEye";

/**
 * Color mapping for different body parts
 */
const getPartColor = (partName: PartNames, colors: CharacterColors): string => {
    if (partName === "LeftEye" || partName === "RightEye") {
        return "#000000"; // Eyes are black
    } else if (partName === "Chest") {
        return colors?.Chest ?? defaultColor; // Chest uses custom color
    } else if (partName === "Pants") {
        return colors?.Pants ?? defaultColor;
    } else if (partName === "LeftFoot" || partName === "RightFoot") {
        return colors?.Feet ?? defaultColor;
    } else if (partName === "LeftHand" || partName === "RightHand") {
        return colors.Hands ?? defaultColor;
    } else {
        return defaultColor; // Default skin color for other parts
    }
};

/**
 * Calculate the maximum number of frames in any single animation
 */
const getMaxFramesPerAnimation = (): number => {
    let maxFrames = 0;
    for (const animation of characterPartFrames) {
        if (animation.parts.length > 0) {
            const frameCount = animation.parts[0].frames.length;
            maxFrames = Math.max(maxFrames, frameCount);
        }
    }
    return maxFrames;
};

export type CharacterSprite = {
    animationName: string;
    sprite: Sprite2;
};

/**
 * Builds sprite sheets for a character with the given customization
 * Creates one sprite per animation, all on the same canvas with each animation on a new row
 * @param scope The render scope to use for drawing
 * @param colors The colors to use for different body parts
 * @returns An array of CharacterSprite objects
 */
export function buildSpriteSheet(
    scope: RenderScope,
    colors: CharacterColors,
): CharacterSprite[] {
    const sprites: CharacterSprite[] = [];

    const maxFramesPerAnimation = getMaxFramesPerAnimation();
    const animationCount = characterPartFrames.length;

    // Create a single canvas with each animation on a new row
    const canvasWidth = CHARACTER_FRAME_WIDTH * maxFramesPerAnimation;
    const canvasHeight = CHARACTER_FRAME_HEIGHT * animationCount;
    const offscreenScope = scope.getOffscreenRenderScope(
        canvasWidth,
        canvasHeight,
    );

    // Iterate through all animations and draw each on its own row
    for (let animIdx = 0; animIdx < characterPartFrames.length; animIdx++) {
        const animation = characterPartFrames[animIdx];
        const animationName = animation.animationName;

        // Get the number of frames from the first part (all parts have same frame count)
        const frameCount = animation.parts[0]?.frames.length || 0;

        // Draw all frames for this animation
        for (let frameIdx = 0; frameIdx < frameCount; frameIdx++) {
            const xOffset = frameIdx * CHARACTER_FRAME_WIDTH;
            const yOffset = animIdx * CHARACTER_FRAME_HEIGHT;

            // Draw all parts for this frame
            for (const part of animation.parts) {
                const frameData = part.frames[frameIdx];
                if (!frameData || frameData.length === 0) {
                    continue; // Skip empty frames
                }

                const color = getPartColor(part.partName, colors);

                // Draw each pixel in the frame data
                // Frame data is [x1, y1, x2, y2, x3, y3, ...]
                for (let i = 0; i < frameData.length; i += 2) {
                    const x = frameData[i];
                    const y = frameData[i + 1];

                    offscreenScope.drawScreenSpaceRectangle({
                        x: xOffset + x,
                        y: yOffset + y,
                        width: 1,
                        height: 1,
                        fill: color,
                    });
                }
            }
        }

        // Create a Sprite2 object for this animation
        // All animations share the same bin, but have different y positions
        const sprite: Sprite2 = {
            bin: "character-generated",
            id: `character-${animationName}`,
            defintion: {
                frames: frameCount,
                w: CHARACTER_FRAME_WIDTH,
                h: CHARACTER_FRAME_HEIGHT,
                x: 0,
                y: animIdx * CHARACTER_FRAME_HEIGHT,
            },
        };

        sprites.push({ animationName, sprite });
    }

    // Get the generated bitmap and store it in the asset loader once
    const bitmap = offscreenScope.getBitmap();
    scope.assetLoader.addGeneratedAsset("character-generated", bitmap);

    return sprites;
}
