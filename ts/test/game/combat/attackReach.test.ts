import assert from "node:assert";
import { describe, it } from "node:test";
import { encodePosition, type Point } from "../../../src/common/point.ts";
import {
    attackFootprint,
    isWithinReach,
} from "../../../src/game/combat/attackReach.ts";
import { addBuilding, createMinimalWorld } from "../testWorld.ts";
import { testAttackProfile } from "./testAttackProfile.ts";

const stand: Point = { x: 12, y: 10 };
const armsReach = testAttackProfile({ range: 1 });
const longReach = testAttackProfile({ range: 5 });

function reaches(
    footprint: ReadonlySet<number>,
    x: number,
    y: number,
): boolean {
    return footprint.has(encodePosition(x, y));
}

describe("attackReach", () => {
    describe("isWithinReach", () => {
        it("covers a cardinal neighbour at range 1 and nothing else", () => {
            assert.strictEqual(
                isWithinReach(armsReach, stand, { x: 11, y: 10 }),
                true,
            );
            assert.strictEqual(
                isWithinReach(armsReach, stand, { x: 13, y: 11 }),
                false,
                "a diagonal is further than one tile, which is what keeps melee cardinal",
            );
            assert.strictEqual(
                isWithinReach(armsReach, stand, stand),
                false,
                "an attacker cannot hit the tile it stands on",
            );
        });

        it("reaches the full distance along an axis and no further", () => {
            assert.strictEqual(
                isWithinReach(longReach, stand, { x: 17, y: 10 }),
                true,
            );
            assert.strictEqual(
                isWithinReach(longReach, stand, { x: 18, y: 10 }),
                false,
            );
        });

        it("measures a diagonal by the disc, not by the bounding square", () => {
            // 3,4 lands exactly on the rim at 25. 4,4 is 32 and outside it,
            // even though a square of side 5 would contain it
            assert.strictEqual(
                isWithinReach(longReach, stand, { x: 15, y: 14 }),
                true,
            );
            assert.strictEqual(
                isWithinReach(longReach, stand, { x: 16, y: 14 }),
                false,
            );
        });
    });

    describe("attackFootprint", () => {
        it("casts a shadow behind a building", () => {
            const { root } = createMinimalWorld();
            addBuilding(root, "granary", { x: 14, y: 10 });

            const footprint = attackFootprint(root, longReach, stand);

            assert.strictEqual(
                reaches(footprint, 14, 10),
                true,
                "the building itself can still be shot at",
            );
            assert.strictEqual(
                reaches(footprint, 16, 10),
                false,
                "the tile directly behind it is in cover",
            );
            assert.strictEqual(
                reaches(footprint, 14, 13),
                true,
                "a tile the building does not stand in front of is still open",
            );
        });
    });
});
