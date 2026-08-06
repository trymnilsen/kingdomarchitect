import type {
    AnchorFrame,
    CharacterAnimation,
    PartFrame,
} from "./animationRecipe.ts";

/**
 * Pairs of body part names that are swapped when mirroring horizontally.
 * Order within a pair does not matter.
 */
export const mirrorPairs: [string, string][] = [
    ["LeftEye", "RightEye"],
    ["LeftHand", "RightHand"],
    ["LeftFoot", "RightFoot"],
];

/**
 * Computes the union bounding box minX/maxX across all parts and all frames
 * of a compiled animation. This establishes the mirror axis.
 *
 * We cannot use a fixed frame width because coordinates in PartFrame are raw
 * pixel positions in source-sprite space (e.g., x in 6..11 for a 16px cell).
 * The correct mirror transform is: newX = (minX + maxX) - oldX, which places
 * the axis of symmetry at the midpoint of the content bounds — consistent with
 * how buildSpriteSheet computes animationBounds for centering.
 */
export function computeXBounds(animation: CharacterAnimation): {
    minX: number;
    maxX: number;
} {
    let minX = Infinity;
    let maxX = -Infinity;

    for (const part of animation.parts) {
        for (const frame of part.frames) {
            for (let i = 0; i < frame.length; i += 2) {
                const x = frame[i];
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
            }
        }
    }

    if (minX === Infinity) {
        return { minX: 0, maxX: 0 };
    }

    return { minX, maxX };
}

/**
 * Flips all pixel X coordinates in a frame around the axis defined by minX + maxX.
 * newX = (minX + maxX) - oldX
 * Y coordinates are preserved unchanged.
 */
export function mirrorPartFrame(
    frame: PartFrame,
    minX: number,
    maxX: number,
): PartFrame {
    const result: number[] = new Array(frame.length);
    for (let i = 0; i < frame.length; i += 2) {
        result[i] = minX + maxX - frame[i];
        result[i + 1] = frame[i + 1];
    }
    return result;
}

/**
 * Flips an anchor's X coordinate around the same axis.
 * Y and z (front/back layer) are preserved unchanged.
 * Returns an empty array unchanged.
 */
export function mirrorAnchorFrame(
    frame: AnchorFrame,
    minX: number,
    maxX: number,
): AnchorFrame {
    if (frame.length < 3) {
        return frame.length === 0 ? [] : [...frame];
    }
    return [minX + maxX - frame[0], frame[1], frame[2]];
}

/**
 * Returns the swap partner of a part or anchor name from mirrorPairs,
 * or the original name if it does not appear in any pair.
 */
export function swapPartName(name: string): string {
    for (const [a, b] of mirrorPairs) {
        if (name === a) return b;
        if (name === b) return a;
    }
    return name;
}
