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

/** The four facing directions a character can have. */
export type Facing = "se" | "sw" | "ne" | "nw";

/**
 * A sparse keyframe recording when facing direction changes.
 * Only transitions are stored — the starting facing is implied by the animation name.
 */
export interface FacingKeyframe {
    frame: number;
    facing: Facing;
}

/**
 * A complete animation: its name, all body part tracks, and all anchor tracks.
 */
export interface CharacterAnimation {
    animationName: string;
    parts: AnimationPart[];
    anchors: AnimationAnchor[];
    /**
     * Sparse list of facing transitions. Absent or empty means the animation
     * maintains the facing implied by its name for all frames.
     * Keyframes must be sorted by frame in ascending order.
     */
    facing?: FacingKeyframe[];
}

/**
 * Derives the initial facing direction from an animation name using naming conventions.
 * "north" in the name indicates a north-facing animation; "west" indicates west-facing.
 */
export function inferFacingFromName(animationName: string): Facing {
    const lower = animationName.toLowerCase();
    const north = lower.includes("north");
    const west = lower.includes("west");
    if (north && west) return "nw";
    if (north) return "ne";
    if (west) return "sw";
    return "se";
}

/**
 * Returns the facing direction at the given frame index by applying keyframes
 * in order against the implied default from the animation name.
 */
export function getFacingAtFrame(
    animation: CharacterAnimation,
    frameIdx: number,
): Facing {
    let current = inferFacingFromName(animation.animationName);
    if (!animation.facing) return current;
    for (const kf of animation.facing) {
        if (kf.frame <= frameIdx) current = kf.facing;
        else break;
    }
    return current;
}
