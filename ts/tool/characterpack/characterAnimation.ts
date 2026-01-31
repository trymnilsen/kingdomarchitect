/**
 * Represents a single frame's data for a specific body part.
 * Each frame is a flat array of coordinates: [x1, y1, x2, y2, x3, y3, ...]
 * If the part is not present in this frame, it will be an empty array.
 * Bounding box can be calculated at runtime from the coordinates.
 */
export type PartFrame = number[];

/**
 * Represents all frames for a specific body part within an animation
 */
export interface AnimationPart {
    partName: string;
    frames: PartFrame[];
}

/**
 * Represents a single anchor point for one frame.
 * Format: [x, y, z] where z=1 means in front, z=0 means behind/occluded.
 * Empty array means the anchor is not present in this frame.
 */
export type AnchorFrame = number[];

/**
 * Represents all frames for a specific anchor within an animation
 */
export interface AnimationAnchor {
    anchorId: string;
    frames: AnchorFrame[];
}

/**
 * Represents a complete animation with all its parts
 */
export interface CharacterAnimation {
    animationName: string;
    parts: AnimationPart[];
    anchors: AnimationAnchor[];
}
