import { describe, it } from "node:test";
import assert from "node:assert";
import {
    computeXBounds,
    mirrorAnchorFrame,
    mirrorPartFrame,
    swapPartName,
} from "../../../src/characterbuilder/animation/timelineMirror.ts";
import type { CharacterAnimation } from "../../../src/characterbuilder/characterAnimation.ts";

function makeAnimation(parts: { partName: string; frames: number[][] }[]): CharacterAnimation {
    return {
        animationName: "test",
        parts: parts.map((p) => ({ partName: p.partName, frames: p.frames })),
        anchors: [],
    };
}

describe("computeXBounds", () => {
    it("returns correct bounds for non-trivial x values", () => {
        const animation = makeAnimation([
            { partName: "Head", frames: [[6, 8, 7, 8, 11, 5, 9, 5]] },
        ]);
        const bounds = computeXBounds(animation);
        assert.deepStrictEqual(bounds, { minX: 6, maxX: 11 });
    });

    it("spans all parts and frames", () => {
        const animation = makeAnimation([
            { partName: "Head", frames: [[7, 4, 8, 4]] },
            { partName: "Chest", frames: [[6, 8, 9, 8], [5, 9, 10, 9]] },
        ]);
        const bounds = computeXBounds(animation);
        assert.deepStrictEqual(bounds, { minX: 5, maxX: 10 });
    });

    it("returns {0,0} for animation with no pixels", () => {
        const animation = makeAnimation([
            { partName: "Head", frames: [[]] },
        ]);
        const bounds = computeXBounds(animation);
        assert.deepStrictEqual(bounds, { minX: 0, maxX: 0 });
    });

    it("returns {0,0} for animation with no parts", () => {
        const bounds = computeXBounds({ animationName: "empty", parts: [], anchors: [] });
        assert.deepStrictEqual(bounds, { minX: 0, maxX: 0 });
    });
});

describe("mirrorPartFrame", () => {
    it("flips x coordinates around the axis defined by minX + maxX", () => {
        // axis = 6 + 11 = 17 → x=6 becomes 11, x=11 becomes 6
        const result = mirrorPartFrame([6, 8, 11, 8], 6, 11);
        assert.deepStrictEqual(result, [11, 8, 6, 8]);
    });

    it("leaves y coordinates unchanged", () => {
        // axis = 6 + 11 = 17 → x=8 becomes 9, x=9 becomes 8
        const result = mirrorPartFrame([8, 5, 9, 7], 6, 11);
        assert.deepStrictEqual(result, [9, 5, 8, 7]);
    });

    it("handles a single pixel", () => {
        const result = mirrorPartFrame([8, 4], 6, 11);
        assert.deepStrictEqual(result, [9, 4]);
    });

    it("returns empty array for empty frame", () => {
        const result = mirrorPartFrame([], 6, 11);
        assert.deepStrictEqual(result, []);
    });
});

describe("mirrorAnchorFrame", () => {
    it("flips anchor x and preserves y and z", () => {
        // axis = 6 + 11 = 17 → x=9 becomes 8
        const result = mirrorAnchorFrame([9, 7, 1], 6, 11);
        assert.deepStrictEqual(result, [8, 7, 1]);
    });

    it("preserves z=0 (back layer)", () => {
        const result = mirrorAnchorFrame([7, 5, 0], 6, 11);
        assert.deepStrictEqual(result, [10, 5, 0]);
    });

    it("returns empty array for absent anchor", () => {
        const result = mirrorAnchorFrame([], 6, 11);
        assert.deepStrictEqual(result, []);
    });
});

describe("swapPartName", () => {
    it("swaps Left to Right", () => {
        assert.strictEqual(swapPartName("LeftHand"), "RightHand");
        assert.strictEqual(swapPartName("LeftEye"), "RightEye");
        assert.strictEqual(swapPartName("LeftFoot"), "RightFoot");
    });

    it("swaps Right to Left", () => {
        assert.strictEqual(swapPartName("RightHand"), "LeftHand");
        assert.strictEqual(swapPartName("RightEye"), "LeftEye");
        assert.strictEqual(swapPartName("RightFoot"), "LeftFoot");
    });

    it("returns original name for unpaired parts", () => {
        assert.strictEqual(swapPartName("Head"), "Head");
        assert.strictEqual(swapPartName("Chest"), "Chest");
        assert.strictEqual(swapPartName("Pants"), "Pants");
    });
});
