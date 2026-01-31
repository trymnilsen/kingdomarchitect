import { characterPartFrames } from "../../generated/characterFrames.ts";
import type {
    RenderScope,
    OffscreenRenderScope,
    OffscreenCanvasFactory,
} from "../rendering/renderScope.ts";
import type { Sprite2 } from "../asset/sprite.ts";
import type { CharacterColors } from "./colors.ts";
import type { Rectangle } from "../common/structure/rectangle.ts";
import { subtractPoint, type Point } from "../common/point.ts";
import { wizardHat } from "../data/inventory/items/equipment.ts";
import { CHARACTER_SPRITE } from "./ui/characterBuilderConstants.ts";
import type { AssetLoader } from "../asset/loader/assetLoader.ts";
import { getCharacterBinId } from "./characterBinId.ts";
import type { AnimationKey } from "../rendering/animation/animationGraph.ts";

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
 * Builds sprite sheets for a character with the given customization
 * Creates one sprite per animation, all on the same canvas with each animation on a new row
 * @param scopeFactory Factory for creating offscreen render scopes
 * @param colors The colors to use for different body parts
 * @param assetLoader The asset loader to register generated sprites with
 * @returns An array of CharacterSprite objects
 */
export function buildSpriteSheet(
    scopeFactory: OffscreenCanvasFactory,
    colors: CharacterColors,
    assetLoader: AssetLoader,
    spriteCache: SpriteDefinitionCache,
): CharacterSprite[] {
    const maxFramesPerAnimation = getMaxFramesPerAnimation();
    const animationCount = characterPartFrames.length;
    const binId = getCharacterBinId(colors);
    if (assetLoader.hasAsset(binId) && spriteCache.has(binId)) {
        return spriteCache.get(binId);
    }
    // Create a single canvas with each animation on a new row
    const canvasWidth = CHARACTER_FRAME_WIDTH * maxFramesPerAnimation;
    const canvasHeight = CHARACTER_FRAME_HEIGHT * animationCount;
    const offscreenScope = scopeFactory(canvasWidth, canvasHeight);

    // Iterate through all animations and draw each on its own row
    for (let animIdx = 0; animIdx < characterPartFrames.length; animIdx++) {
        const animation = characterPartFrames[animIdx];
        const animationName = animation.animationName;

        // Get the number of frames from the first part (all parts have same frame count)
        const frameCount = animationFrameCount(animation);

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

        const sprite: Sprite2 = {
            bin: binId,
            id: `${animationName}`,
            defintion: {
                frames: animationFrameCount(animation),
                w: CHARACTER_FRAME_WIDTH,
                h: CHARACTER_FRAME_HEIGHT,
                x: 0,
                y: animIdx * CHARACTER_FRAME_HEIGHT,
            },
        };

        const characterSprite = {
            animationName: animationName,
            sprite,
            offset: { x: -16, y: -12 },
        };

        spriteCache.addAnimation(binId, animationName, characterSprite);
    }

    // Get the generated bitmap and store it in the asset loader once
    const bitmap = offscreenScope.getBitmap();
    assetLoader.addGeneratedAsset(binId, bitmap);

    return spriteCache.get(binId);
}

export class SpriteDefinitionCache {
    private cache = new Map<string, Map<AnimationKey, CharacterSprite>>();

    has(binId: string): boolean {
        return this.cache.has(binId);
    }

    addAnimation(
        binId: string,
        animationName: string,
        characterSprite: CharacterSprite,
    ): void {
        let animationMap = this.cache.get(binId);
        if (!animationMap) {
            animationMap = new Map<AnimationKey, CharacterSprite>();
            this.cache.set(binId, animationMap);
        }
        animationMap.set(animationName as AnimationKey, characterSprite);
    }

    get(binId: string): CharacterSprite[] {
        const animationMap = this.cache.get(binId);
        if (!animationMap) {
            return [];
        }
        return Array.from(animationMap.values());
    }

    getSpriteFor(characterId: string, animationName: string): Sprite2 {
        const animationMap = this.cache.get(characterId);
        if (!animationMap) {
            throw new Error(
                `No cached sprites found for character: ${characterId}`,
            );
        }
        const characterSprite = animationMap.get(animationName as AnimationKey);
        if (!characterSprite) {
            throw new Error(
                `No cached sprite found for character: ${characterId}, animation: ${animationName}`,
            );
        }
        return characterSprite.sprite;
    }
}

/**
 * Color mapping for different body parts
 */
function getPartColor(partName: PartNames, colors: CharacterColors): string {
    switch (partName) {
        case "LeftEye":
        case "RightEye":
            return "#000000";
        case "Chest":
            return colors.Chest ?? defaultColor;
        case "Pants":
            return colors.Pants ?? colors.Chest ?? defaultColor;
        case "LeftFoot":
        case "RightFoot":
            return colors.Feet ?? defaultColor;
        case "LeftHand":
        case "RightHand":
            return colors.Hands ?? defaultColor;
        default:
            return defaultColor;
    }
}

/**
 * Calculate the bounding box of a body part based on its pixel coordinates
 * @param frameData Array of pixel coordinates [x1, y1, x2, y2, ...]
 * @returns Rectangle containing the bounds (x, y, width, height)
 */
function getPartBounds(frameData: readonly number[]): Rectangle {
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
}

/**
 * Calculate the maximum number of frames in any single animation
 */
function getMaxFramesPerAnimation(): number {
    let maxFrames = 0;
    for (const animation of characterPartFrames) {
        if (animation.parts.length > 0) {
            const frameCount = animationFrameCount(animation);
            maxFrames = Math.max(maxFrames, frameCount);
        }
    }
    return maxFrames;
}

/**
 * Calculate the overall bounding box for all parts in a single frame
 * @param animation The animation containing all parts
 * @param frameIdx The frame index to calculate bounds for
 * @returns Rectangle containing the combined bounds of all parts
 */
function getFrameBounds(
    animation: (typeof characterPartFrames)[number],
    frameIdx: number,
): Rectangle {
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
}

export type CharacterSprite = {
    animationName: string;
    sprite: Sprite2;
    offset: Point;
};

/**
 * Calculate the overall bounding box across all frames in an animation
 * This ensures consistent positioning across all frames (e.g., for jump animations)
 */
function getAnimationBounds(
    animation: (typeof characterPartFrames)[number],
): Rectangle {
    const frameCount = animationFrameCount(animation);

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
}

/**
 * Draw a single part's pixels to the sprite sheet
 */
function drawPartPixels(
    offscreenScope: RenderScope,
    frameData: readonly number[],
    frameBaseX: number,
    frameBaseY: number,
    contentCenterX: number,
    contentCenterY: number,
    animationBounds: Rectangle,
    color: string,
) {
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
}

/**
 * Generate outline pixels from a set of pixels
 * Outlines are drawn on top, left, and right sides, but not on the bottom
 * @param pixelSet Set of pixel coordinates as "x,y" strings
 * @param maxY The maximum Y coordinate of all pixels
 * @param outlineColor The color of the outline
 * @returns Array of outline pixel coordinates with their color
 */
function generateOutlineFromPixels(
    pixelSet: Set<string>,
    maxY: number,
    outlineColor: string = "#000000",
): Array<{ x: number; y: number; color: string }> {
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
}

/**
 * Draw outline pixels directly to the frame (no animation bounds adjustment needed)
 */
function drawFrameOutline(
    offscreenScope: RenderScope,
    outlinePixels: Array<{ x: number; y: number; color: string }>,
    frameBaseX: number,
    frameBaseY: number,
) {
    for (const pixel of outlinePixels) {
        offscreenScope.drawScreenSpaceRectangle({
            x: frameBaseX + pixel.x,
            y: frameBaseY + pixel.y,
            width: 1,
            height: 1,
            fill: pixel.color,
        });
    }
}

/**
 * Draw equipment sprites at anchor positions for a given z-layer.
 * @param targetZ 0 for behind the character, 1 for in front
 */
function drawEquipmentAtAnchors(
    offscreenScope: OffscreenRenderScope,
    animation: (typeof characterPartFrames)[number],
    frameIdx: number,
    equipment: NonNullable<CharacterColors["Equipment"]>,
    frameBaseX: number,
    frameBaseY: number,
    contentCenterX: number,
    contentCenterY: number,
    animationBounds: Rectangle,
    targetZ: number,
): void {
    for (const equip of equipment) {
        const anchor = animation.anchors.find(
            (a) => a.anchorId === equip.anchor,
        );
        if (!anchor) {
            continue;
        }

        const anchorFrame = anchor.frames[frameIdx];
        if (!anchorFrame || anchorFrame.length < 3) {
            continue;
        }

        const [anchorX, anchorY, z] = anchorFrame;
        if (z !== targetZ) {
            continue;
        }

        const drawX =
            frameBaseX +
            contentCenterX +
            (anchorX - animationBounds.x) -
            equip.offsetInSpriteForAnchorPoint.x;
        const drawY =
            frameBaseY +
            contentCenterY +
            (anchorY - animationBounds.y) -
            equip.offsetInSpriteForAnchorPoint.y;

        offscreenScope.drawScreenSpaceSprite({
            x: drawX,
            y: drawY,
            sprite: equip.sprite,
        });
    }
}

/**
 * Draw all frames of a single animation to the sprite sheet
 */
function drawAnimation(
    offscreenScope: OffscreenRenderScope,
    animation: (typeof characterPartFrames)[number],
    animIdx: number,
    colors: CharacterColors,
    animationBounds: Rectangle,
): void {
    const frameCount = animationFrameCount(animation);

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

        // Step 1: Draw back-layer equipment (behind the character)
        if (colors.Equipment && colors.Equipment.length > 0) {
            drawEquipmentAtAnchors(
                offscreenScope,
                animation,
                frameIdx,
                colors.Equipment,
                frameBaseX,
                frameBaseY,
                contentCenterX,
                contentCenterY,
                animationBounds,
                0,
            );
        }

        // Step 2: Draw all character parts directly to the main canvas
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

            // Draw the part's pixels to main canvas
            for (let i = 0; i < frameData.length; i += 2) {
                const x = frameData[i];
                const y = frameData[i + 1];

                const adjustedX =
                    frameBaseX + contentCenterX + (x - animationBounds.x);
                const adjustedY =
                    frameBaseY + contentCenterY + (y - animationBounds.y);

                offscreenScope.drawScreenSpaceRectangle({
                    x: adjustedX,
                    y: adjustedY,
                    width: 1,
                    height: 1,
                    fill: color,
                });
            }

            // Step 3: Draw equipment for head parts
            if (part.partName === "Head") {
                const partBounds = getPartBounds(frameData);
                const position = subtractPoint(
                    partBounds,
                    wizardHat.visual.offset,
                );
                const adjustedX =
                    frameBaseX +
                    contentCenterX +
                    (position.x - animationBounds.x);
                const adjustedY =
                    frameBaseY +
                    contentCenterY +
                    (position.y - animationBounds.y);

                offscreenScope.drawScreenSpaceSprite({
                    x: adjustedX,
                    y: adjustedY,
                    sprite: wizardHat.visual.sprite,
                });
            }
        }

        // Step 4: Draw front-layer equipment (in front of the character)
        if (colors.Equipment && colors.Equipment.length > 0) {
            drawEquipmentAtAnchors(
                offscreenScope,
                animation,
                frameIdx,
                colors.Equipment,
                frameBaseX,
                frameBaseY,
                contentCenterX,
                contentCenterY,
                animationBounds,
                1,
            );
        }

        // Step 5: Extract pixels from the frame region in the main canvas
        const { pixelSet, maxY } = offscreenScope.extractPixels(
            frameBaseX,
            frameBaseY,
            CHARACTER_FRAME_WIDTH,
            CHARACTER_FRAME_HEIGHT,
        );

        // Step 6: Generate outline from extracted pixels
        const outlinePixels = generateOutlineFromPixels(pixelSet, maxY);

        // Step 7: Draw outline on top of the frame
        drawFrameOutline(offscreenScope, outlinePixels, frameBaseX, frameBaseY);
    }
}

function animationFrameCount(
    animation: (typeof characterPartFrames)[number],
): number {
    return animation.parts[0]?.frames.length ?? 0;
}
