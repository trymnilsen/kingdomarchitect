import { existsSync, readFileSync } from "fs";
import * as path from "path";
import * as util from "util";
import { PNGWithMetadata } from "pngjs";
import { collectAssetFiles } from "../util/files.js";
import { PixelColor } from "../util/pixels.js";
import { getPixelColor, readPng } from "../util/pngHelper.js";
import type { CharacterDefinition } from "./characterDefinition.js";
import type { ColorRegion, PixelPosition } from "./colorRegion.js";
import type {
    CharacterAnimation,
    AnimationPart,
    PartFrame,
} from "./characterAnimation.js";

const assetPath = path.join(process.cwd(), "asset", "character");
run();

async function run() {
    const { pngFiles, jsonFiles } = await collectAssetFiles(assetPath);
    for (const jsonFile of jsonFiles) {
        const defintionPath = jsonFile;
        const pngFile = path.basename(jsonFile).replace(".json", "") + ".png";
        const sourceFilePath = path.join(path.dirname(jsonFile), pngFile);

        if (!existsSync(sourceFilePath)) {
            console.error(`Sprite does not exist ${sourceFilePath}`);
            return;
        }

        const frames = processCharacterFile(defintionPath, sourceFilePath);

        console.log(`\nProcessed ${sourceFilePath}:`);
        for (const animation of frames) {
            console.log(`\n  Animation: ${animation.animationName}`);
            console.log(`  Parts: ${animation.parts.length}`);

            for (const part of animation.parts) {
                console.log(
                    `    - ${part.partName}: ${part.frames.length} frames`,
                );
                for (let i = 0; i < part.frames.length; i++) {
                    const frame = part.frames[i];
                    if (frame.boundingBox) {
                        console.log(
                            `      Frame ${i}: bbox(${frame.boundingBox.x},${frame.boundingBox.y},${frame.boundingBox.width}x${frame.boundingBox.height}) ${frame.pixels.length} pixels`,
                        );
                    } else {
                        console.log(`      Frame ${i}: [empty]`);
                    }
                }
            }
        }

        console.log(
            util.inspect(frames, {
                showHidden: false,
                depth: null,
                colors: true,
            }),
        );
    }
}

function processCharacterFile(
    definitionPath: string,
    sourceFilePath: string,
): CharacterAnimation[] {
    const definitionFileContent = readFileSync(definitionPath, {
        encoding: "utf8",
    });
    const definition: CharacterDefinition = JSON.parse(definitionFileContent);
    const pngImage = readPng(sourceFilePath);

    const animations: CharacterAnimation[] = [];

    // Process each animation (each row in the sprite sheet)
    for (let i = 0; i < definition.animations.length; i++) {
        const animationName = definition.animations[i];
        const animationY = getAnimationY(
            i,
            definition.height,
            definition.offset,
        );

        // Calculate number of frames by looking at the width of the sprite sheet
        const totalWidthPerFrame =
            definition.offset + definition.width + definition.offset;
        const maxFrames = Math.floor(pngImage.width / totalWidthPerFrame);

        // Map to store parts and their frame data for this animation
        // Key is part name, value is a Map from frameIndex to frame data
        const partsMap = new Map<string, Map<number, PartFrame>>();

        // Initialize all parts from the definition
        for (const partName of Object.values(definition.colors)) {
            partsMap.set(partName, new Map());
        }

        // Process each frame in this animation
        for (let frameIndex = 0; frameIndex < maxFrames; frameIndex++) {
            const frameX = getFrameX(
                frameIndex,
                definition.width,
                definition.offset,
            );

            // Check if this frame is within bounds
            if (
                frameX + definition.width > pngImage.width ||
                animationY + definition.height > pngImage.height
            ) {
                break;
            }

            const colorRegions = processSpriteFrame(
                pngImage,
                frameX,
                animationY,
                definition.width,
                definition.height,
                definition.colors,
            );

            // Store frame data for each part that appears in this frame
            for (const region of colorRegions) {
                const partFramesMap = partsMap.get(region.name)!;
                partFramesMap.set(frameIndex, {
                    boundingBox: region.boundingBox,
                    pixels: region.pixels,
                });
            }
        }

        // Convert map to AnimationPart array with complete frame arrays
        const parts: AnimationPart[] = Array.from(partsMap.entries()).map(
            ([partName, frameMap]) => {
                // Create array with entry for each frame index
                const frames: PartFrame[] = [];
                for (let i = 0; i < maxFrames; i++) {
                    const frameData = frameMap.get(i);
                    if (frameData) {
                        frames.push(frameData);
                    } else {
                        // Empty frame - part not present
                        frames.push({
                            pixels: [],
                        });
                    }
                }

                return {
                    partName: partName,
                    frames: frames,
                };
            },
        );

        animations.push({
            animationName: animationName,
            parts: parts,
        });
    }

    return animations;
}

/**
 * Calculates the starting X position for a frame in the sprite sheet
 */
function getFrameX(frameIndex: number, width: number, offset: number): number {
    return frameIndex * (offset + width + offset) + offset;
}

/**
 * Calculates the starting Y position for an animation row in the sprite sheet
 */
function getAnimationY(
    animationIndex: number,
    height: number,
    offset: number,
): number {
    return animationIndex * (offset + height + offset) + offset;
}

/**
 * Converts a hex color string to a PixelColor for comparison
 */
function hexToPixelColor(hex: string): PixelColor {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { red: r, green: g, blue: b, alpha: 255 };
}

/**
 * Checks if two pixel colors match (ignoring alpha for color matching)
 */
function colorsMatch(a: PixelColor, b: PixelColor): boolean {
    return a.red === b.red && a.green === b.green && a.blue === b.blue;
}

/**
 * Processes a single sprite frame to extract color regions with bounding boxes
 */
function processSpriteFrame(
    png: PNGWithMetadata,
    startX: number,
    startY: number,
    width: number,
    height: number,
    colorDefinitions: Record<string, string>,
): ColorRegion[] {
    const colorRegions: ColorRegion[] = [];
    const colorMap = new Map<string, PixelColor>();

    // Convert hex colors to PixelColors for matching
    for (const [hex, name] of Object.entries(colorDefinitions)) {
        colorMap.set(hex, hexToPixelColor(hex));
    }

    // Process each defined color
    for (const [hex, name] of Object.entries(colorDefinitions)) {
        const targetColor = colorMap.get(hex)!;
        const pixels: PixelPosition[] = [];

        // Scan the sprite viewport for this color
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const absoluteX = startX + x;
                const absoluteY = startY + y;
                const pixelColor = getPixelColor(png, absoluteX, absoluteY);

                if (colorsMatch(pixelColor, targetColor)) {
                    pixels.push({
                        x: x, // Relative to sprite
                        y: y, // Relative to sprite
                    });
                }
            }
        }

        // Calculate bounding box if pixels were found
        if (pixels.length > 0) {
            const xs = pixels.map((p) => p.x);
            const ys = pixels.map((p) => p.y);

            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            colorRegions.push({
                name: name,
                boundingBox: {
                    x: minX,
                    y: minY,
                    width: maxX - minX + 1,
                    height: maxY - minY + 1,
                },
                pixels: pixels,
            });
        }
    }

    return colorRegions;
}
