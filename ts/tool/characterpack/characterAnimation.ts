import type { Rectangle } from "../../src/common/structure/rectangle.js";
import type { PixelPosition } from "./colorRegion.js";

/**
 * Represents a single frame's data for a specific body part
 * If the part is not present in this frame, boundingBox will be undefined
 * and pixels will be an empty array
 */
export interface PartFrame {
    boundingBox?: Rectangle;
    pixels: PixelPosition[];
}

/**
 * Represents all frames for a specific body part within an animation
 */
export interface AnimationPart {
    partName: string;
    frames: PartFrame[];
}

/**
 * Represents a complete animation with all its parts
 */
export interface CharacterAnimation {
    animationName: string;
    parts: AnimationPart[];
}
