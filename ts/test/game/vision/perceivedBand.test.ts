import assert from "node:assert";
import { describe, it } from "node:test";
import { perceivedBandAt } from "../../../src/game/vision/perceivedBand.ts";
import { createVisibilityMapComponent } from "../../../src/game/component/visibilityMapComponent.ts";
import type { LightEmitter } from "../../../src/game/light/lightEmitter.ts";
import { makeNumberId } from "../../../src/common/point.ts";

/**
 * perceivedBandAt is the single rule the visibility model rests on:
 * min(reach, illumination). These cases pin each quadrant of that min, plus the
 * day-is-globally-bright behaviour, so the rule cannot silently regress to a
 * phase-switch again.
 */
describe("perceivedBandAt", () => {
    // One emitter: bright out to radius 2 (distSq <= 4), dim out to radius 4
    // (distSq <= 16). Placed off-origin so the distance maths is exercised.
    const emitters: LightEmitter[] = [
        { position: { x: 12, y: 8 }, brightRadiusSq: 4, dimRadiusSq: 16 },
    ];

    function reachOf(...tiles: Array<[number, number]>) {
        const map = createVisibilityMapComponent();
        for (const [x, y] of tiles) {
            map.visibility.add(makeNumberId(x, y));
        }
        return map;
    }

    it("at night, in reach and brightly lit reads bright", () => {
        const map = reachOf([12, 8]);
        assert.strictEqual(perceivedBandAt(map, emitters, "night", 12, 8), "bright");
    });

    it("at night, in reach and dimly lit reads dim", () => {
        // (15,8) is distSq 9 from the emitter: outside bright (4), inside dim (16).
        const map = reachOf([15, 8]);
        assert.strictEqual(perceivedBandAt(map, emitters, "night", 15, 8), "dim");
    });

    it("at night, in reach but unlit reads dark — reach alone is not sight", () => {
        // (18,8) is distSq 36 from the emitter: beyond all light.
        const map = reachOf([18, 8]);
        assert.strictEqual(perceivedBandAt(map, emitters, "night", 18, 8), "dark");
    });

    it("brightly lit but out of reach reads dark — min binds on reach", () => {
        // (13,8) is distSq 1 (bright) but is not in the reach set.
        const map = reachOf([12, 8]);
        assert.strictEqual(perceivedBandAt(map, emitters, "night", 13, 8), "dark");
    });

    it("by day, in reach reads bright even where no source lights it", () => {
        // Same unlit tile as the night-dark case; daylight is a global bright.
        const map = reachOf([18, 8]);
        assert.strictEqual(perceivedBandAt(map, emitters, "day", 18, 8), "bright");
    });
});
