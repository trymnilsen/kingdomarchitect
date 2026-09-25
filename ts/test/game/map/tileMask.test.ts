import assert from "node:assert";
import { describe, it } from "node:test";
import {
    createEmptyMask,
    isMaskSet,
    masksEqual,
    masksOverlap,
    mirrorMask,
    orientMask,
    rotateMaskClockwise,
    stampMask,
    type TileMask,
} from "../../../src/game/map/tileMask.ts";

// no symmetry so a wrong rotation or mirror shows
const lShape: TileMask = { width: 3, height: 2, rows: [0b111, 0b100] };

function setTiles(mask: TileMask): string[] {
    const tiles: string[] = [];
    for (let y = 0; y < mask.height; y++) {
        for (let x = 0; x < mask.width; x++) {
            if (isMaskSet(mask, x, y)) {
                tiles.push(`${x},${y}`);
            }
        }
    }
    return tiles;
}

describe("tileMask", () => {
    it("reads the most significant bit as the leftmost tile", () => {
        assert.deepStrictEqual(setTiles(lShape), ["0,0", "1,0", "2,0", "0,1"]);
        assert.strictEqual(isMaskSet(lShape, 3, 0), false);
        assert.strictEqual(isMaskSet(lShape, -1, 1), false);
    });

    it("rotates a quarter turn clockwise", () => {
        const rotated = rotateMaskClockwise(lShape);
        assert.strictEqual(rotated.width, 2);
        assert.strictEqual(rotated.height, 3);
        assert.deepStrictEqual(rotated.rows, [0b11, 0b01, 0b01]);
    });

    it("mirrors left to right", () => {
        assert.deepStrictEqual(mirrorMask(lShape).rows, [0b111, 0b001]);
    });

    it("comes back to the original after four quarter turns", () => {
        assert.ok(masksEqual(orientMask(lShape, 4, false), lShape));
        assert.ok(masksEqual(mirrorMask(mirrorMask(lShape)), lShape));
    });

    it("reaches eight distinct orientations of an asymmetric shape", () => {
        const orientations = new Set<string>();
        for (const mirrored of [false, true]) {
            for (let turns = 0; turns < 4; turns++) {
                const oriented = orientMask(lShape, turns, mirrored);
                orientations.add(
                    `${oriented.width}x${oriented.height}:${oriented.rows.join(",")}`,
                );
            }
        }
        assert.strictEqual(orientations.size, 8);
    });

    it("stamps a mask at an offset without changing the target", () => {
        const target = createEmptyMask(8, 8);
        const stamped = stampMask(target, lShape, 3, 5);

        assert.deepStrictEqual(setTiles(stamped), ["3,5", "4,5", "5,5", "3,6"]);
        assert.deepStrictEqual(setTiles(target), []);
    });

    it("clips the parts of a stamp that fall outside the target", () => {
        const stamped = stampMask(createEmptyMask(8, 8), lShape, 6, 7);
        assert.deepStrictEqual(setTiles(stamped), ["6,7", "7,7"]);

        const leftOfTarget = stampMask(createEmptyMask(8, 8), lShape, -2, 2);
        assert.deepStrictEqual(setTiles(leftOfTarget), ["0,2"]);

        const farOutside = stampMask(createEmptyMask(8, 8), lShape, -40, 2);
        assert.deepStrictEqual(setTiles(farOutside), []);
    });

    it("detects overlap only where tiles coincide", () => {
        const water = stampMask(createEmptyMask(8, 8), lShape, 3, 5);

        const single: TileMask = { width: 1, height: 1, rows: [0b1] };
        assert.strictEqual(masksOverlap(water, single, 4, 6), false);
        assert.strictEqual(masksOverlap(water, single, 5, 5), true);
        assert.strictEqual(masksOverlap(water, lShape, 3, 3), false);
        assert.strictEqual(masksOverlap(water, lShape, 1, 5), true);
    });
});
