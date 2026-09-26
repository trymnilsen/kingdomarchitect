import type {
    RenderScope,
    OffscreenRenderScope,
    OffscreenCanvasFactory,
} from "../../rendering/renderScope.ts";
import type { SpriteDefinition, SpriteRef } from "../../asset/sprite.ts";
import { spriteRegistry } from "../../asset/spriteRegistry.ts";
import type { CharacterColors } from "../../rendering/character/characterColors.ts";
import { placeEquipmentSprite } from "../../rendering/character/placeEquipmentSprite.ts";
import { CHARACTER_FRAME } from "../../rendering/character/characterFrame.ts";
import type { Rectangle } from "../../common/structure/rectangle.ts";
import type { Point } from "../../common/point.ts";
import type { AssetLoader } from "../../asset/loader/assetLoader.ts";
import { getCharacterBinId } from "./characterBinId.ts";
import {
    getFacingAtFrame,
    type CharacterAnimation,
} from "../../rendering/character/characterAnimation.ts";

const CHARACTER_FRAME_WIDTH = CHARACTER_FRAME.WIDTH;
const CHARACTER_FRAME_HEIGHT = CHARACTER_FRAME.HEIGHT;

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
 * Draws every animation for one appearance onto a single sheet, one row per
 * animation. Cached by appearance, so each look is only drawn once.
 */
export function buildSpriteSheet(
    scopeFactory: OffscreenCanvasFactory,
    colors: CharacterColors,
    assetLoader: AssetLoader,
    spriteCache: SpriteDefinitionCache,
    animations: CharacterAnimation[],
): CharacterSprite[] {
    const maxFramesPerAnimation = getMaxFramesPerAnimation(animations);
    const animationCount = animations.length;
    const binId = getCharacterBinId(colors);
    if (assetLoader.hasAsset(binId) && spriteCache.has(binId)) {
        return spriteCache.get(binId);
    }
    const canvasWidth = CHARACTER_FRAME_WIDTH * maxFramesPerAnimation;
    const canvasHeight = CHARACTER_FRAME_HEIGHT * animationCount;
    const offscreenScope = scopeFactory(canvasWidth, canvasHeight);

    for (let animIdx = 0; animIdx < animations.length; animIdx++) {
        const animation = animations[animIdx];
        const animationName = animation.animationName;
        const animationBounds = getAnimationBounds(animation);

        drawAnimation(
            offscreenScope,
            animation,
            animIdx,
            colors,
            animationBounds,
        );

        const spriteRef: SpriteRef = {
            bin: binId,
            spriteId: `${animationName}`,
        };

        const definition: SpriteDefinition = [
            CHARACTER_FRAME_WIDTH,
            CHARACTER_FRAME_HEIGHT,
            0,
            animIdx * CHARACTER_FRAME_HEIGHT,
            animationFrameCount(animation),
        ];

        spriteRegistry.registerSprite(spriteRef, definition);

        const characterSprite: CharacterSprite = {
            animationName: animationName,
            sprite: spriteRef,
            offset: { x: -16, y: -12 },
        };

        spriteCache.addAnimation(binId, animationName, characterSprite);
    }

    const bitmap = offscreenScope.getBitmap();
    assetLoader.addGeneratedAsset(binId, bitmap);

    return spriteCache.get(binId);
}

export class SpriteDefinitionCache {
    private cache = new Map<string, Map<string, CharacterSprite>>();

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
            animationMap = new Map<string, CharacterSprite>();
            this.cache.set(binId, animationMap);
        }
        animationMap.set(animationName, characterSprite);
    }

    get(binId: string): CharacterSprite[] {
        const animationMap = this.cache.get(binId);
        if (!animationMap) {
            return [];
        }
        return Array.from(animationMap.values());
    }

    getSpriteFor(characterId: string, animationName: string): SpriteRef {
        const animationMap = this.cache.get(characterId);
        if (!animationMap) {
            throw new Error(
                `No cached sprites found for character: ${characterId}`,
            );
        }
        const characterSprite = animationMap.get(animationName);
        if (!characterSprite) {
            throw new Error(
                `No cached sprite found for character: ${characterId}, animation: ${animationName}`,
            );
        }
        return characterSprite.sprite;
    }
}

function getPartColor(partName: string, colors: CharacterColors): string {
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

/** @param frameData Flat pixel coordinates: [x1, y1, x2, y2, ...] */
function getPartBounds(frameData: readonly number[]): Rectangle {
    if (frameData.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

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

function getMaxFramesPerAnimation(animations: CharacterAnimation[]): number {
    let maxFrames = 0;
    for (const animation of animations) {
        if (animation.parts.length > 0) {
            const frameCount = animationFrameCount(animation);
            maxFrames = Math.max(maxFrames, frameCount);
        }
    }
    return maxFrames;
}

function getFrameBounds(
    animation: CharacterAnimation,
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
    sprite: SpriteRef;
    offset: Point;
};

/**
 * Frames are centred on this shared box rather than their own, so a jumping
 * character does not slide around inside the sprite.
 */
function getAnimationBounds(animation: CharacterAnimation): Rectangle {
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
 * A one-pixel outline around the pixels, except below the bottom row.
 * @param pixelSet Pixel coordinates as "x,y" strings
 */
function generateOutlineFromPixels(
    pixelSet: Set<string>,
    maxY: number,
    outlineColor: string = "#000000",
): Array<{ x: number; y: number; color: string }> {
    const outlinePixels: Array<{ x: number; y: number; color: string }> = [];
    const outlineSet = new Set<string>();

    for (const pixelKey of pixelSet) {
        const [xStr, yStr] = pixelKey.split(",");
        const x = parseInt(xStr);
        const y = parseInt(yStr);

        const directions = [
            { dx: 0, dy: -1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
        ];

        for (const { dx, dy } of directions) {
            const checkX = x + dx;
            const checkY = y + dy;
            const key = `${checkX},${checkY}`;

            if (pixelSet.has(key)) {
                continue;
            }

            if (dy > 0 && y === maxY) {
                continue;
            }

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

/** Outline pixels are already in frame space, so only the frame's base offset applies. */
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

/** @param targetZ 0 for behind the character, 1 for in front */
function drawEquipment(
    offscreenScope: OffscreenRenderScope,
    animation: CharacterAnimation,
    frameIdx: number,
    equipment: NonNullable<CharacterColors["Equipment"]>,
    frameBaseX: number,
    frameBaseY: number,
    contentCenterX: number,
    contentCenterY: number,
    animationBounds: Rectangle,
    targetZ: number,
): void {
    const facing = getFacingAtFrame(animation, frameIdx);

    for (const equip of equipment) {
        let attachBox: Rectangle;

        if ("anchor" in equip) {
            const anchor = animation.anchors.find(
                (a) => a.anchorId === equip.anchor,
            );
            if (!anchor) continue;

            const anchorFrame = anchor.frames[frameIdx];
            if (!anchorFrame || anchorFrame.length < 3) continue;

            const [anchorX, anchorY, z] = anchorFrame;
            if (z !== targetZ) continue;

            attachBox = { x: anchorX, y: anchorY, width: 1, height: 1 };
        } else {
            if ((equip.z ?? 1) !== targetZ) continue;

            const part = animation.parts.find(
                (p) => p.partName === equip.attachToPart,
            );
            const frameData = part?.frames[frameIdx] ?? [];
            if (frameData.length === 0) continue;

            attachBox = getPartBounds(frameData);
        }

        const placement = placeEquipmentSprite(equip.sprite, facing, attachBox);
        if (!placement) continue;

        const drawX =
            frameBaseX + contentCenterX + (placement.x - animationBounds.x);
        const drawY =
            frameBaseY + contentCenterY + (placement.y - animationBounds.y);
        if (placement.flipX) {
            offscreenScope.drawScreenSpaceSpriteFlippedX({
                x: drawX,
                y: drawY,
                sprite: placement.sprite,
            });
        } else {
            offscreenScope.drawScreenSpaceSprite({
                x: drawX,
                y: drawY,
                sprite: placement.sprite,
            });
        }
    }
}

function drawAnimation(
    offscreenScope: OffscreenRenderScope,
    animation: CharacterAnimation,
    animIdx: number,
    colors: CharacterColors,
    animationBounds: Rectangle,
): void {
    const frameCount = animationFrameCount(animation);

    const contentCenterX = Math.floor(
        (CHARACTER_FRAME_WIDTH - animationBounds.width) / 2,
    );
    const contentCenterY = Math.floor(
        (CHARACTER_FRAME_HEIGHT - animationBounds.height) / 2,
    );

    for (let frameIdx = 0; frameIdx < frameCount; frameIdx++) {
        const frameBaseX = frameIdx * CHARACTER_FRAME_WIDTH;
        const frameBaseY = animIdx * CHARACTER_FRAME_HEIGHT;

        // Layer 0 equipment goes behind the character.
        if (colors.Equipment && colors.Equipment.length > 0) {
            drawEquipment(
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

        for (const part of animation.parts) {
            const frameData = part.frames[frameIdx];
            if (!frameData || frameData.length === 0) {
                continue;
            }

            if (frameData.length % 2 !== 0) {
                throw new Error(
                    `Uneven framenumber in ${part.partName} for ${animation.animationName} on frame ${frameIdx}`,
                );
            }

            const color = getPartColor(part.partName, colors);

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
        }

        // Layer 1 equipment goes in front.
        if (colors.Equipment && colors.Equipment.length > 0) {
            drawEquipment(
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

        // The outline is traced from the finished frame, so it wraps character
        // and equipment together instead of each part separately.
        const { pixelSet, maxY } = offscreenScope.extractPixels(
            frameBaseX,
            frameBaseY,
            CHARACTER_FRAME_WIDTH,
            CHARACTER_FRAME_HEIGHT,
        );

        const outlinePixels = generateOutlineFromPixels(pixelSet, maxY);
        drawFrameOutline(offscreenScope, outlinePixels, frameBaseX, frameBaseY);
    }
}

function animationFrameCount(animation: CharacterAnimation): number {
    return animation.parts[0]?.frames.length ?? 0;
}
