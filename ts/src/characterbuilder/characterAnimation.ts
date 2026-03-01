/**
 * Flat array of pixel coordinates: [x1, y1, x2, y2, ...]
 * Coordinates are raw pixel positions in source-sprite space.
 * They are NOT 0-based — a 16px frame cell may have x values like 6..11.
 * An empty array means the part is absent for that frame.
 */
export type PartFrame = number[];

/**
 * All frames for one body part within an animation.
 */
export interface AnimationPart {
    partName: string;
    frames: PartFrame[];
}

/**
 * Single anchor point for one frame: [x, y, z] where z=0 is behind, z=1 is in front.
 * An empty array means the anchor is absent for that frame.
 */
export type AnchorFrame = number[];

/**
 * All frames for one anchor point within an animation.
 */
export interface AnimationAnchor {
    anchorId: string;
    frames: AnchorFrame[];
}

/**
 * A complete animation: its name, all body part tracks, and all anchor tracks.
 */
export interface CharacterAnimation {
    animationName: string;
    parts: AnimationPart[];
    anchors: AnimationAnchor[];
}
