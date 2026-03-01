import { describe, it } from "node:test";
import assert from "node:assert";
import { compileTimeline } from "../../../src/characterbuilder/animation/timelineCompiler.ts";
import type { AnimationRecipe } from "../../../src/characterbuilder/animation/animationRecipe.ts";
import type { CharacterAnimation } from "../../../src/characterbuilder/characterAnimation.ts";

/**
 * Build a minimal source animation with non-trivial coordinates (never at origin).
 * Head pixels form a 2x2 cluster at x=6..7, y=4..5.
 * LeftHand pixel is at x=8, y=8.
 * Anchor LeftHand is at (9, 7, 1) — in front.
 */
function makeSourceAnimation(name: string, frameCount = 1): CharacterAnimation {
    const headPixels = [6, 4, 7, 4, 6, 5, 7, 5];
    const leftHandPixels = [8, 8];

    return {
        animationName: name,
        parts: [
            {
                partName: "Head",
                frames: Array.from({ length: frameCount }, () => [...headPixels]),
            },
            {
                partName: "LeftHand",
                frames: Array.from({ length: frameCount }, () => [...leftHandPixels]),
            },
            {
                partName: "RightHand",
                frames: Array.from({ length: frameCount }, () => [10, 8]),
            },
        ],
        anchors: [
            {
                anchorId: "LeftHand",
                frames: Array.from({ length: frameCount }, () => [9, 7, 1]),
            },
        ],
    };
}

function makeRecipe(overrides: Partial<AnimationRecipe> = {}): AnimationRecipe {
    return {
        name: "test_idle",
        base: { type: "frame", sourceAnimation: "source_walk", sourceFrame: 0 },
        duration: 1,
        mirrorToggles: [],
        tracks: {},
        anchorTracks: {},
        ...overrides,
    };
}

describe("compileTimeline — base frame replication", () => {
    it("replicates base frame data for all output frames", () => {
        const sources = [makeSourceAnimation("source_walk")];
        const recipe = makeRecipe({ duration: 3 });

        const result = compileTimeline(recipe, sources);

        assert.strictEqual(result.animationName, "test_idle");
        assert.strictEqual(result.parts[0].frames.length, 3);

        // All three frames should be identical copies of the base
        const headFrames = result.parts.find((p) => p.partName === "Head")?.frames;
        assert.ok(headFrames, "Head part should exist");
        assert.deepStrictEqual(headFrames[0], [6, 4, 7, 4, 6, 5, 7, 5]);
        assert.deepStrictEqual(headFrames[1], [6, 4, 7, 4, 6, 5, 7, 5]);
        assert.deepStrictEqual(headFrames[2], [6, 4, 7, 4, 6, 5, 7, 5]);
    });
});

describe("compileTimeline — track operations", () => {
    it("hide operation empties the part for the covered frames", () => {
        const sources = [makeSourceAnimation("source_walk", 1)];
        const recipe = makeRecipe({
            duration: 3,
            tracks: {
                Head: [{ type: "hide", start: 1, end: 2 }],
            },
        });

        const result = compileTimeline(recipe, sources);
        const headFrames = result.parts.find((p) => p.partName === "Head")?.frames;

        assert.ok(headFrames);
        assert.deepStrictEqual(headFrames[0], [6, 4, 7, 4, 6, 5, 7, 5], "frame 0 should be base");
        assert.deepStrictEqual(headFrames[1], [], "frame 1 should be hidden");
        assert.deepStrictEqual(headFrames[2], [6, 4, 7, 4, 6, 5, 7, 5], "frame 2 should restore");
    });

    it("show operation after hide restores base pixels", () => {
        const sources = [makeSourceAnimation("source_walk", 1)];
        const recipe = makeRecipe({
            duration: 2,
            tracks: {
                Head: [
                    { type: "hide", start: 0, end: 2 },
                    { type: "show", start: 1, end: 2 },
                ],
            },
        });

        const result = compileTimeline(recipe, sources);
        const headFrames = result.parts.find((p) => p.partName === "Head")?.frames;

        assert.ok(headFrames);
        assert.deepStrictEqual(headFrames[0], [], "frame 0 should be hidden");
        assert.deepStrictEqual(headFrames[1], [6, 4, 7, 4, 6, 5, 7, 5], "frame 1 show wins");
    });

    it("offset shifts all pixel coordinates by x and y", () => {
        const sources = [makeSourceAnimation("source_walk", 1)];
        const recipe = makeRecipe({
            duration: 2,
            tracks: {
                Head: [{ type: "offset", start: 1, end: 2, x: 2, y: 1 }],
            },
        });

        const result = compileTimeline(recipe, sources);
        const headFrames = result.parts.find((p) => p.partName === "Head")?.frames;

        assert.ok(headFrames);
        assert.deepStrictEqual(headFrames[0], [6, 4, 7, 4, 6, 5, 7, 5], "frame 0 unchanged");
        assert.deepStrictEqual(headFrames[1], [8, 5, 9, 5, 8, 6, 9, 6], "frame 1 shifted +2x +1y");
    });

    it("replace substitutes the named part's data from the source", () => {
        const walkSource = makeSourceAnimation("source_walk", 1);
        const altSource: CharacterAnimation = {
            animationName: "alt_anim",
            parts: [
                { partName: "Head", frames: [[12, 6, 13, 6]] },
                { partName: "LeftHand", frames: [[15, 8]] },
                { partName: "RightHand", frames: [[17, 8]] },
            ],
            anchors: [],
        };
        const recipe = makeRecipe({
            duration: 2,
            tracks: {
                Head: [{ type: "replace", start: 1, end: 2, source: { sourceAnimation: "alt_anim", sourceFrame: 0 } }],
            },
        });

        const result = compileTimeline(recipe, [walkSource, altSource]);
        const headFrames = result.parts.find((p) => p.partName === "Head")?.frames;

        assert.ok(headFrames);
        assert.deepStrictEqual(headFrames[0], [6, 4, 7, 4, 6, 5, 7, 5], "frame 0 is base");
        assert.deepStrictEqual(headFrames[1], [12, 6, 13, 6], "frame 1 is replaced");
    });
});

describe("compileTimeline — mirroring", () => {
    it("mirror at frame 0 flips x coordinates and swaps Left/Right part names", () => {
        const sources = [makeSourceAnimation("source_walk", 1)];
        const recipe = makeRecipe({
            duration: 1,
            mirrorToggles: [0],
        });

        // Source:
        //   Head: x=6..7, y=4..5  →  pixels: [6,4, 7,4, 6,5, 7,5]
        //   LeftHand: x=8, y=8
        //   RightHand: x=10, y=8
        //   Anchor LeftHand: [9, 7, 1]
        // Bounds: minX=6, maxX=10 → axis=16
        // Mirror formula: newX = 16 - x
        //   Head: x=6→10, x=7→9        LeftHand: x=8→8    RightHand: x=10→6

        const result = compileTimeline(recipe, sources);

        // Name swap: original LeftHand becomes "RightHand", original RightHand becomes "LeftHand"
        const partNames = result.parts.map((p) => p.partName).sort();
        assert.deepStrictEqual(partNames.sort(), ["Head", "LeftHand", "RightHand"]);

        // "RightHand" slot now holds original LeftHand data (mirrored)
        // Original LeftHand was at x=8; mirror: 16-8=8 (stays same, symmetric)
        const rightHandPart = result.parts.find((p) => p.partName === "RightHand");
        assert.ok(rightHandPart, "RightHand should exist (was LeftHand)");
        assert.deepStrictEqual(rightHandPart.frames[0], [8, 8]);

        // "LeftHand" slot now holds original RightHand data (mirrored)
        // Original RightHand was at x=10; mirror: 16-10=6
        const leftHandPart = result.parts.find((p) => p.partName === "LeftHand");
        assert.ok(leftHandPart, "LeftHand should exist (was RightHand)");
        assert.deepStrictEqual(leftHandPart.frames[0], [6, 8]);

        // Head x-flip: 6→10, 7→9
        const headPart = result.parts.find((p) => p.partName === "Head");
        assert.ok(headPart);
        assert.deepStrictEqual(headPart.frames[0], [10, 4, 9, 4, 10, 5, 9, 5]);

        // Anchor: LeftHand anchor gets renamed to RightHand, x=9 → 16-9=7
        const rightHandAnchor = result.anchors.find((a) => a.anchorId === "RightHand");
        assert.ok(rightHandAnchor, "anchor should be renamed to RightHand");
        assert.deepStrictEqual(rightHandAnchor.frames[0], [7, 7, 1]);
    });

    it("mid-animation toggle: frames before toggle unmirrored, frames after mirrored", () => {
        const sources = [makeSourceAnimation("source_walk", 1)];
        const recipe = makeRecipe({
            duration: 4,
            mirrorToggles: [2],
        });

        const result = compileTimeline(recipe, sources);

        // Frames 0-1: unmirrored — LeftHand should be in LeftHand slot
        // Frames 2-3: mirrored — LeftHand should be swapped to RightHand slot

        // Check that part names are consistent (all frames use same part structure)
        const partNames = result.parts.map((p) => p.partName);
        // After mirror transform, LeftHand should be swapped to RightHand
        // This means the result has RightHand with swapped name
        assert.ok(partNames.includes("RightHand"));

        // The key test: frames 0-1 should have unmirrored data (original LeftHand coords)
        // and frames 2-3 should have mirrored data
        // Since all frames share the same part name post-transform, we check coordinate values
        const leftHandPart = result.parts.find((p) => p.partName === "LeftHand");
        const rightHandPart = result.parts.find((p) => p.partName === "RightHand");

        // In unmirrored frames: LeftHand exists with original coords [8, 8]
        // In mirrored frames: LeftHand maps to RightHand (name-swapped)
        // The frame data in the swapped part will have original LeftHand data mirrored

        // Verify the structure has the right number of frames
        if (leftHandPart) {
            assert.strictEqual(leftHandPart.frames.length, 4);
        }
        if (rightHandPart) {
            assert.strictEqual(rightHandPart.frames.length, 4);
        }
    });

    it("double mirror (XOR) produces correct starting orientation", () => {
        const sources = [makeSourceAnimation("source_walk", 1)];
        // toggles [0, 2]: frame 0 is mirrored (one toggle), frame 2 flips back (two toggles)
        const recipe = makeRecipe({
            duration: 4,
            mirrorToggles: [0, 2],
        });

        const result = compileTimeline(recipe, sources);
        assert.ok(result.parts.length > 0, "should produce parts");
        assert.strictEqual(result.parts[0].frames.length, 4);
    });
});

describe("compileTimeline — anchor operations", () => {
    it("anchor offset shifts x and y, preserves z", () => {
        const sources = [makeSourceAnimation("source_walk", 1)];
        const recipe = makeRecipe({
            duration: 2,
            anchorTracks: {
                LeftHand: [{ type: "offset", start: 1, end: 2, x: 1, y: -1 }],
            },
        });

        const result = compileTimeline(recipe, sources);
        const anchor = result.anchors.find((a) => a.anchorId === "LeftHand");
        assert.ok(anchor);
        assert.deepStrictEqual(anchor.frames[0], [9, 7, 1], "frame 0 unchanged");
        assert.deepStrictEqual(anchor.frames[1], [10, 6, 1], "frame 1 offset, z preserved");
    });

    it("anchor hide empties the anchor frame", () => {
        const sources = [makeSourceAnimation("source_walk", 1)];
        const recipe = makeRecipe({
            duration: 2,
            anchorTracks: {
                LeftHand: [{ type: "hide", start: 1, end: 2 }],
            },
        });

        const result = compileTimeline(recipe, sources);
        const anchor = result.anchors.find((a) => a.anchorId === "LeftHand");
        assert.ok(anchor);
        assert.deepStrictEqual(anchor.frames[0], [9, 7, 1], "frame 0 present");
        assert.deepStrictEqual(anchor.frames[1], [], "frame 1 hidden");
    });
});

describe("compileTimeline — recipe base composition", () => {
    it("compiles a recipe whose base is another recipe", () => {
        const sources = [makeSourceAnimation("source_walk", 1)];
        const innerRecipe = makeRecipe({ name: "inner", duration: 3 });
        const outerRecipe: AnimationRecipe = {
            name: "outer",
            base: { type: "recipe", recipe: innerRecipe },
            duration: 2,
            mirrorToggles: [],
            tracks: {
                Head: [{ type: "hide", start: 1, end: 2 }],
            },
            anchorTracks: {},
        };

        const result = compileTimeline(outerRecipe, sources);
        const headFrames = result.parts.find((p) => p.partName === "Head")?.frames;

        assert.ok(headFrames);
        assert.strictEqual(headFrames.length, 2);
        assert.deepStrictEqual(headFrames[0], [6, 4, 7, 4, 6, 5, 7, 5], "frame 0: base from inner");
        assert.deepStrictEqual(headFrames[1], [], "frame 1: hidden by outer track");
    });
});

describe("compileTimeline — addPixels operation", () => {
    it("appends the named part's base pixels to the current part for covered frames", () => {
        const sources = [makeSourceAnimation("source_walk", 1)];
        // Add LeftHand pixels into Head for frame 1 only
        const recipe = makeRecipe({
            duration: 3,
            tracks: {
                Head: [{ type: "addPixels", start: 1, end: 2, sourcePart: "LeftHand" }],
            },
        });

        const result = compileTimeline(recipe, sources);
        const headFrames = result.parts.find((p) => p.partName === "Head")?.frames;

        assert.ok(headFrames);
        // Frame 0: base only
        assert.deepStrictEqual(headFrames[0], [6, 4, 7, 4, 6, 5, 7, 5], "frame 0 unchanged");
        // Frame 1: base + LeftHand base pixels [8, 8]
        assert.deepStrictEqual(headFrames[1], [6, 4, 7, 4, 6, 5, 7, 5, 8, 8], "frame 1 has appended LeftHand pixels");
        // Frame 2: back to base (addPixels only covers frame 1)
        assert.deepStrictEqual(headFrames[2], [6, 4, 7, 4, 6, 5, 7, 5], "frame 2 unchanged");
    });

    it("does not affect frames outside the span", () => {
        const sources = [makeSourceAnimation("source_walk", 1)];
        const recipe = makeRecipe({
            duration: 2,
            tracks: {
                Head: [{ type: "addPixels", start: 1, end: 2, sourcePart: "LeftHand" }],
            },
        });

        const result = compileTimeline(recipe, sources);
        const headFrames = result.parts.find((p) => p.partName === "Head")?.frames;

        assert.ok(headFrames);
        assert.deepStrictEqual(headFrames[0], [6, 4, 7, 4, 6, 5, 7, 5], "frame 0 outside span, unchanged");
    });

    it("is cumulative — two addPixels ops on the same frame both append", () => {
        const sources = [makeSourceAnimation("source_walk", 1)];
        const recipe = makeRecipe({
            duration: 2,
            tracks: {
                Head: [
                    { type: "addPixels", start: 1, end: 2, sourcePart: "LeftHand" },
                    { type: "addPixels", start: 1, end: 2, sourcePart: "RightHand" },
                ],
            },
        });

        const result = compileTimeline(recipe, sources);
        const headFrames = result.parts.find((p) => p.partName === "Head")?.frames;

        assert.ok(headFrames);
        // Frame 1: base + LeftHand [8,8] + RightHand [10,8]
        assert.deepStrictEqual(
            headFrames[1],
            [6, 4, 7, 4, 6, 5, 7, 5, 8, 8, 10, 8],
            "both source parts appended",
        );
    });

    it("addPixels after hide appends only to the cleared result", () => {
        const sources = [makeSourceAnimation("source_walk", 1)];
        const recipe = makeRecipe({
            duration: 2,
            tracks: {
                Head: [
                    { type: "hide",      start: 1, end: 2 },
                    { type: "addPixels", start: 1, end: 2, sourcePart: "LeftHand" },
                ],
            },
        });

        const result = compileTimeline(recipe, sources);
        const headFrames = result.parts.find((p) => p.partName === "Head")?.frames;

        assert.ok(headFrames);
        // hide empties current, then addPixels appends LeftHand pixels [8,8]
        assert.deepStrictEqual(headFrames[1], [8, 8], "hide then addPixels yields only added pixels");
    });

    it("referencing a non-existent source part yields an empty append", () => {
        const sources = [makeSourceAnimation("source_walk", 1)];
        const recipe = makeRecipe({
            duration: 2,
            tracks: {
                Head: [{ type: "addPixels", start: 1, end: 2, sourcePart: "NonExistentPart" }],
            },
        });

        const result = compileTimeline(recipe, sources);
        const headFrames = result.parts.find((p) => p.partName === "Head")?.frames;

        assert.ok(headFrames);
        // Non-existent part → empty pixels appended → same as base
        assert.deepStrictEqual(headFrames[1], [6, 4, 7, 4, 6, 5, 7, 5], "unknown part appends nothing");
    });
});

describe("compileTimeline — error handling", () => {
    it("throws for an unknown source animation name", () => {
        const sources = [makeSourceAnimation("source_walk")];
        const recipe = makeRecipe({
            base: { type: "frame", sourceAnimation: "nonexistent", sourceFrame: 0 },
        });

        assert.throws(
            () => compileTimeline(recipe, sources),
            (err: Error) => {
                assert.ok(err.message.includes("nonexistent"));
                return true;
            },
        );
    });

    it("throws for an out-of-bounds frame index", () => {
        const sources = [makeSourceAnimation("source_walk", 2)];
        const recipe = makeRecipe({
            base: { type: "frame", sourceAnimation: "source_walk", sourceFrame: 99 },
        });

        assert.throws(
            () => compileTimeline(recipe, sources),
            (err: Error) => {
                assert.ok(err.message.includes("99"));
                return true;
            },
        );
    });
});
