import type {
    AnchorFrame,
    AnchorTrackOperation,
    AnimationAnchor,
    AnimationPart,
    AnimationRecipe,
    CharacterAnimation,
    PartFrame,
    TrackOperation,
} from "./animationRecipe.ts";
import {
    computeXBounds,
    mirrorAnchorFrame,
    mirrorPartFrame,
    swapPartName,
} from "./timelineMirror.ts";

/**
 * Compiles an AnimationRecipe into a CharacterAnimation by applying track
 * operations and mirror transforms against the provided source animations.
 *
 * @param recipe The serializable recipe describing the animation
 * @param sourceAnimations The pool of source animations to draw base frames
 *   and replace-operation frames from
 * @returns A fully realized CharacterAnimation ready for buildSpriteSheet
 * @throws If any referenced source animation name cannot be found, or if a
 *   frame index is out of bounds
 */
export function compileTimeline(
    recipe: AnimationRecipe,
    sourceAnimations: CharacterAnimation[],
): CharacterAnimation {
    const baseAnimation = resolveBase(recipe, sourceAnimations);
    const baseFrame = extractBaseFrame(baseAnimation, recipe);

    const sortedToggles = [...recipe.mirrorToggles].sort((a, b) => a - b);

    const compiledParts = buildPartFrames(recipe, baseFrame, sourceAnimations);
    const compiledAnchors = buildAnchorFrames(recipe, baseFrame);

    const intermediate: CharacterAnimation = {
        animationName: recipe.name,
        parts: compiledParts,
        anchors: compiledAnchors,
    };

    return applyMirrorTransform(intermediate, sortedToggles);
}

function resolveBase(
    recipe: AnimationRecipe,
    sourceAnimations: CharacterAnimation[],
): CharacterAnimation {
    if (recipe.base.type === "frame") {
        return findSourceAnimation(recipe.base.sourceAnimation, sourceAnimations);
    }
    return compileTimeline(recipe.base.recipe, sourceAnimations);
}

/**
 * Returns the base animation to copy pixels from. For a "frame" base this is
 * the source animation directly. For a "recipe" base the compiler has already
 * produced a CharacterAnimation — we treat its frame 0 as the base frame.
 */
function extractBaseFrame(
    baseAnimation: CharacterAnimation,
    recipe: AnimationRecipe,
): CharacterAnimation {
    if (recipe.base.type === "frame") {
        const frameIndex = recipe.base.sourceFrame;
        const frameCount = baseAnimation.parts[0]?.frames.length ?? 0;
        if (frameIndex < 0 || frameIndex >= frameCount) {
            throw new Error(
                `Frame index ${frameIndex} is out of bounds for animation "${recipe.base.sourceAnimation}" (${frameCount} frames)`,
            );
        }
        return snapshotFrame(baseAnimation, frameIndex);
    }
    return snapshotFrame(baseAnimation, 0);
}

/**
 * Returns a CharacterAnimation with a single frame copied from the given index.
 */
function snapshotFrame(
    animation: CharacterAnimation,
    frameIndex: number,
): CharacterAnimation {
    return {
        animationName: animation.animationName,
        parts: animation.parts.map((part) => ({
            partName: part.partName,
            frames: [[...(part.frames[frameIndex] ?? [])]],
        })),
        anchors: animation.anchors.map((anchor) => ({
            anchorId: anchor.anchorId,
            frames: [[...(anchor.frames[frameIndex] ?? [])]],
        })),
    };
}

function buildPartFrames(
    recipe: AnimationRecipe,
    baseFrame: CharacterAnimation,
    sourceAnimations: CharacterAnimation[],
): AnimationPart[] {
    const allPartNames = new Set<string>([
        ...baseFrame.parts.map((p) => p.partName),
        ...Object.keys(recipe.tracks),
    ]);

    return Array.from(allPartNames).map((partName) => {
        const basePart = baseFrame.parts.find((p) => p.partName === partName);
        const basePixels = basePart?.frames[0] ?? [];
        const ops = recipe.tracks[partName] ?? [];

        const frames: PartFrame[] = [];
        for (let f = 0; f < recipe.duration; f++) {
            frames.push(applyTrackOps(partName, basePixels, ops, f, sourceAnimations));
        }

        return { partName, frames };
    });
}

function buildAnchorFrames(
    recipe: AnimationRecipe,
    baseFrame: CharacterAnimation,
): AnimationAnchor[] {
    const allAnchorIds = new Set<string>([
        ...baseFrame.anchors.map((a) => a.anchorId),
        ...Object.keys(recipe.anchorTracks),
    ]);

    return Array.from(allAnchorIds).map((anchorId) => {
        const baseAnchor = baseFrame.anchors.find((a) => a.anchorId === anchorId);
        const baseAnchorFrame = baseAnchor?.frames[0] ?? [];
        const ops = recipe.anchorTracks[anchorId] ?? [];

        const frames: AnchorFrame[] = [];
        for (let f = 0; f < recipe.duration; f++) {
            frames.push(applyAnchorOps(baseAnchorFrame, ops, f));
        }

        return { anchorId, frames };
    });
}

function applyTrackOps(
    partName: string,
    basePixels: PartFrame,
    ops: TrackOperation[],
    frameIndex: number,
    sourceAnimations: CharacterAnimation[],
): PartFrame {
    let current: PartFrame = [...basePixels];

    for (const op of ops) {
        if (frameIndex < op.start || frameIndex >= op.end) {
            continue;
        }

        switch (op.type) {
            case "hide":
                current = [];
                break;
            case "show":
                current = [...basePixels];
                break;
            case "offset": {
                const shifted: number[] = new Array(current.length);
                for (let i = 0; i < current.length; i += 2) {
                    shifted[i] = current[i] + op.x;
                    shifted[i + 1] = current[i + 1] + op.y;
                }
                current = shifted;
                break;
            }
            case "replace": {
                const sourceAnim = findSourceAnimation(
                    op.source.sourceAnimation,
                    sourceAnimations,
                );
                const targetFrame = op.source.sourceFrame;
                const sourcePart = sourceAnim.parts.find(
                    (p) => p.partName === partName,
                );
                const frameCount = sourcePart?.frames.length ?? 0;
                if (targetFrame < 0 || targetFrame >= frameCount) {
                    throw new Error(
                        `Replace operation: frame ${targetFrame} is out of bounds for part "${partName}" in animation "${op.source.sourceAnimation}" (${frameCount} frames)`,
                    );
                }
                current = [...(sourcePart?.frames[targetFrame] ?? [])];
                break;
            }
        }
    }

    return current;
}

function applyAnchorOps(
    baseAnchorFrame: AnchorFrame,
    ops: AnchorTrackOperation[],
    frameIndex: number,
): AnchorFrame {
    let current: AnchorFrame = [...baseAnchorFrame];

    for (const op of ops) {
        if (frameIndex < op.start || frameIndex >= op.end) {
            continue;
        }

        switch (op.type) {
            case "hide":
                current = [];
                break;
            case "offset":
                if (current.length >= 3) {
                    current = [current[0] + op.x, current[1] + op.y, current[2]];
                }
                break;
        }
    }

    return current;
}

function applyMirrorTransform(
    animation: CharacterAnimation,
    sortedToggles: number[],
): CharacterAnimation {
    if (sortedToggles.length === 0) {
        return animation;
    }

    const { minX, maxX } = computeXBounds(animation);

    const frameCount = animation.parts[0]?.frames.length ?? 0;
    const mirroredFrameIndices = new Set<number>();
    for (let f = 0; f < frameCount; f++) {
        if (computeMirrorStateAtFrame(sortedToggles, f)) {
            mirroredFrameIndices.add(f);
        }
    }

    if (mirroredFrameIndices.size === 0) {
        return animation;
    }

    const newParts: AnimationPart[] = animation.parts.map((part) => ({
        partName: swapPartName(part.partName),
        frames: part.frames.map((frame, f) =>
            mirroredFrameIndices.has(f)
                ? mirrorPartFrame(frame, minX, maxX)
                : [...frame],
        ),
    }));

    const newAnchors: AnimationAnchor[] = animation.anchors.map((anchor) => ({
        anchorId: swapPartName(anchor.anchorId),
        frames: anchor.frames.map((frame, f) =>
            mirroredFrameIndices.has(f)
                ? mirrorAnchorFrame(frame, minX, maxX)
                : [...frame],
        ),
    }));

    return {
        animationName: animation.animationName,
        parts: newParts,
        anchors: newAnchors,
    };
}

/**
 * Returns true if the frame at the given index should be in a mirrored state.
 * The state starts as false (unmirrored) and flips at each toggle frame <= f.
 * Toggles must be pre-sorted in ascending order.
 */
export function computeMirrorStateAtFrame(
    sortedToggles: number[],
    frameIndex: number,
): boolean {
    let mirrored = false;
    for (const toggle of sortedToggles) {
        if (toggle > frameIndex) break;
        mirrored = !mirrored;
    }
    return mirrored;
}

function findSourceAnimation(
    name: string,
    sourceAnimations: CharacterAnimation[],
): CharacterAnimation {
    const found = sourceAnimations.find((a) => a.animationName === name);
    if (!found) {
        throw new Error(
            `Source animation "${name}" not found. Available: ${sourceAnimations.map((a) => a.animationName).join(", ")}`,
        );
    }
    return found;
}
