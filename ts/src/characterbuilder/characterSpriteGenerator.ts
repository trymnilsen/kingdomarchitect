import { characterPartFrames } from "../../generated/characterFrames.js";
import type { RenderScope } from "../rendering/renderScope.js";
import type { Sprite2 } from "../asset/sprite.js";
import type { CharacterColors } from "./colors.js";
import type { Rectangle } from "../common/structure/rectangle.js";
import { subtractPoint } from "../common/point.js";
import { wizardHat } from "../data/inventory/items/equipment.js";
import { CHARACTER_SPRITE } from "./ui/characterBuilderConstants.js";

const CHARACTER_FRAME_WIDTH = CHARACTER_SPRITE.FRAME_WIDTH;
const CHARACTER_FRAME_HEIGHT = CHARACTER_SPRITE.FRAME_HEIGHT;

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
        return colors.Chest ?? defaultColor; // Chest uses custom color
    } else if (partName === "Pants") {
        if (colors.Pants) {
            return colors.Pants;
        } else if (colors.Chest) {
            return colors.Chest;
        } else {
            return defaultColor;
        }
    } else if (partName === "LeftFoot" || partName === "RightFoot") {
        return colors.Feet ?? defaultColor;
    } else if (partName === "LeftHand" || partName === "RightHand") {
        return colors.Hands ?? defaultColor;
    } else {
        return defaultColor; // Default skin color for other parts
    }
};

/**
 * Calculate the bounding box of a body part based on its pixel coordinates
 * @param frameData Array of pixel coordinates [x1, y1, x2, y2, ...]
 * @returns Rectangle containing the bounds (x, y, width, height)
 */
const getPartBounds = (frameData: readonly number[]): Rectangle => {
    if (frameData.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Iterate through coordinate pairs to find min/max bounds
    for (let i = 0; i < frameData.length; i += 2) {
        const x = frameData[i];
        const y = frameData[i + 1];

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
    };
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

/**
 * Calculate the overall bounding box for all parts in a single frame
 * @param animation The animation containing all parts
 * @param frameIdx The frame index to calculate bounds for
 * @returns Rectangle containing the combined bounds of all parts
 */
const getFrameBounds = (
    animation: (typeof characterPartFrames)[number],
    frameIdx: number,
): Rectangle => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const part of animation.parts) {
        const frameData = part.frames[frameIdx];
        if (!frameData || frameData.length === 0) {
            continue;
        }

        const partBounds = getPartBounds(frameData);
        if (partBounds.width === 0 || partBounds.height === 0) {
            continue;
        }

        minX = Math.min(minX, partBounds.x);
        minY = Math.min(minY, partBounds.y);
        maxX = Math.max(maxX, partBounds.x + partBounds.width - 1);
        maxY = Math.max(maxY, partBounds.y + partBounds.height - 1);
    }

    if (minX === Infinity) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
    };
};

export type CharacterSprite = {
    animationName: string;
    sprite: Sprite2;
};

/**
 * Calculate the overall bounding box across all frames in an animation
 * This ensures consistent positioning across all frames (e.g., for jump animations)
 */
const getAnimationBounds = (
    animation: (typeof characterPartFrames)[number],
): Rectangle => {
    const frameCount = animation.parts[0]?.frames.length || 0;

    let animMinX = Infinity;
    let animMinY = Infinity;
    let animMaxX = -Infinity;
    let animMaxY = -Infinity;

    for (let frameIdx = 0; frameIdx < frameCount; frameIdx++) {
        const frameBounds = getFrameBounds(animation, frameIdx);
        if (frameBounds.width > 0 && frameBounds.height > 0) {
            animMinX = Math.min(animMinX, frameBounds.x);
            animMinY = Math.min(animMinY, frameBounds.y);
            animMaxX = Math.max(
                animMaxX,
                frameBounds.x + frameBounds.width - 1,
            );
            animMaxY = Math.max(
                animMaxY,
                frameBounds.y + frameBounds.height - 1,
            );
        }
    }

    return {
        x: animMinX,
        y: animMinY,
        width: animMaxX - animMinX + 1,
        height: animMaxY - animMinY + 1,
    };
};

/**
 * Draw a single part's pixels to the sprite sheet
 */
const drawPartPixels = (
    offscreenScope: RenderScope,
    frameData: readonly number[],
    frameBaseX: number,
    frameBaseY: number,
    contentCenterX: number,
    contentCenterY: number,
    animationBounds: Rectangle,
    color: string,
) => {
    for (let i = 0; i < frameData.length; i += 2) {
        const x = frameData[i];
        const y = frameData[i + 1];

        // Adjust coordinates to center content relative to animation bounds
        const adjustedX = frameBaseX + contentCenterX + (x - animationBounds.x);
        const adjustedY = frameBaseY + contentCenterY + (y - animationBounds.y);

        offscreenScope.drawScreenSpaceRectangle({
            x: adjustedX,
            y: adjustedY,
            width: 1,
            height: 1,
            fill: color,
        });
    }
};

/**
 * Generate outline pixels for a complete frame (all parts combined)
 * Outlines are drawn on top, left, and right sides, but not on the bottom
 * @param animation The animation containing all parts
 * @param frameIdx The frame index to generate outline for
 * @param outlineColor The color of the outline
 * @returns Array of outline pixel coordinates with their color
 */
const generateFrameOutlinePixels = (
    animation: (typeof characterPartFrames)[number],
    frameIdx: number,
    outlineColor: string = "#000000",
): Array<{ x: number; y: number; color: string }> => {
    // Collect all pixels from all parts in this frame
    const pixelSet = new Set<string>();
    let maxY = -Infinity;

    for (const part of animation.parts) {
        const frameData = part.frames[frameIdx];
        if (!frameData || frameData.length === 0) {
            continue;
        }

        for (let i = 0; i < frameData.length; i += 2) {
            const x = frameData[i];
            const y = frameData[i + 1];
            pixelSet.add(`${x},${y}`);
            maxY = Math.max(maxY, y);
        }
    }

    const outlinePixels: Array<{ x: number; y: number; color: string }> = [];
    const outlineSet = new Set<string>();

    // Check each pixel and add outline pixels around it
    for (const pixelKey of pixelSet) {
        const [xStr, yStr] = pixelKey.split(",");
        const x = parseInt(xStr);
        const y = parseInt(yStr);

        // Check only 4 cardinal directions (no diagonals)
        const directions = [
            { dx: 0, dy: -1 }, // top
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 }, // right
            { dx: 0, dy: 1 }, // bottom
        ];

        for (const { dx, dy } of directions) {
            const checkX = x + dx;
            const checkY = y + dy;
            const key = `${checkX},${checkY}`;

            // Skip if this position already has a pixel
            if (pixelSet.has(key)) {
                continue;
            }

            // Skip bottom outline - don't add outline below pixels at the maximum Y
            if (dy > 0 && y === maxY) {
                continue;
            }

            // Add outline pixel
            if (!outlineSet.has(key)) {
                outlinePixels.push({
                    x: checkX,
                    y: checkY,
                    color: outlineColor,
                });
                outlineSet.add(key);
            }
        }
    }

    return outlinePixels;
};

/**
 * Draw outline pixels for an entire frame
 */
const drawFrameOutline = (
    offscreenScope: RenderScope,
    outlinePixels: Array<{ x: number; y: number; color: string }>,
    frameBaseX: number,
    frameBaseY: number,
    contentCenterX: number,
    contentCenterY: number,
    animationBounds: Rectangle,
) => {
    for (const pixel of outlinePixels) {
        const adjustedX =
            frameBaseX + contentCenterX + (pixel.x - animationBounds.x);
        const adjustedY =
            frameBaseY + contentCenterY + (pixel.y - animationBounds.y);

        offscreenScope.drawScreenSpaceRectangle({
            x: adjustedX,
            y: adjustedY,
            width: 1,
            height: 1,
            fill: pixel.color,
        });
    }
};

/**
 * Draw equipment on the head part (currently hardcoded to wizard hat)
 */
const drawHeadEquipment = (
    offscreenScope: RenderScope,
    frameData: readonly number[],
    frameBaseX: number,
    frameBaseY: number,
    contentCenterX: number,
    contentCenterY: number,
    animationBounds: Rectangle,
) => {
    const partBounds = getPartBounds(frameData);
    const position = subtractPoint(partBounds, wizardHat.visual.offset);
    const adjustedX =
        frameBaseX + contentCenterX + (position.x - animationBounds.x);
    const adjustedY =
        frameBaseY + contentCenterY + (position.y - animationBounds.y);

    offscreenScope.drawScreenSpaceSprite({
        x: adjustedX,
        y: adjustedY,
        sprite: wizardHat.visual.sprite,
    });
};

/**
 * Draw all frames of a single animation to the sprite sheet
 */
const drawAnimation = (
    offscreenScope: RenderScope,
    animation: (typeof characterPartFrames)[number],
    animIdx: number,
    colors: CharacterColors,
    animationBounds: Rectangle,
): void => {
    const frameCount = animation.parts[0]?.frames.length || 0;

    // Calculate offset to center the animation content within the frame
    const contentCenterX = Math.floor(
        (CHARACTER_FRAME_WIDTH - animationBounds.width) / 2,
    );
    const contentCenterY = Math.floor(
        (CHARACTER_FRAME_HEIGHT - animationBounds.height) / 2,
    );

    // Draw all frames for this animation
    for (let frameIdx = 0; frameIdx < frameCount; frameIdx++) {
        // Calculate the base position for this frame in the sprite sheet
        const frameBaseX = frameIdx * CHARACTER_FRAME_WIDTH;
        const frameBaseY = animIdx * CHARACTER_FRAME_HEIGHT;

        // Generate outline for the entire frame first
        const outlinePixels = generateFrameOutlinePixels(animation, frameIdx);
        drawFrameOutline(
            offscreenScope,
            outlinePixels,
            frameBaseX,
            frameBaseY,
            contentCenterX,
            contentCenterY,
            animationBounds,
        );

        // Draw all parts for this frame
        for (const part of animation.parts) {
            const frameData = part.frames[frameIdx];
            if (!frameData || frameData.length === 0) {
                continue; // Skip empty frames
            }

            if (frameData.length % 2 !== 0) {
                throw new Error(
                    `Uneven framenumber in ${part.partName} for ${animation.animationName} on frame ${frameIdx}`,
                );
            }

            const color = getPartColor(part.partName, colors);

            // Draw the part's pixels
            drawPartPixels(
                offscreenScope,
                frameData,
                frameBaseX,
                frameBaseY,
                contentCenterX,
                contentCenterY,
                animationBounds,
                color,
            );

            // Draw equipment for head parts
            if (part.partName === "Head") {
                drawHeadEquipment(
                    offscreenScope,
                    frameData,
                    frameBaseX,
                    frameBaseY,
                    contentCenterX,
                    contentCenterY,
                    animationBounds,
                );
            }
        }
    }
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

        // Calculate the overall bounds across all frames in this animation
        const animationBounds = getAnimationBounds(animation);

        // Draw all frames of this animation
        drawAnimation(
            offscreenScope,
            animation,
            animIdx,
            colors,
            animationBounds,
        );

        // Create a Sprite2 object for this animation
        // The x,y position points to the first frame of this animation in the sprite sheet
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
