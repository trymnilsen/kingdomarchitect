import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../src/game/entity/entity.ts";
import type { Point } from "../../src/common/point.ts";
import {
    createDayComponent,
    type Phase,
} from "../../src/game/component/dayComponent.ts";
import { createLightSourceComponent } from "../../src/game/component/lightSourceComponent.ts";
import { illuminationBandAt } from "../../src/game/light/illumination.ts";

function makeWorld(phase: Phase): Entity {
    const root = new Entity("root");
    const day = createDayComponent();
    day.phase = phase;
    root.setEcsComponent(day);
    return root;
}

function addSource(
    root: Entity,
    id: string,
    sourceId: string,
    position: Point,
): void {
    const source = new Entity(id);
    root.addChild(source);
    source.setEcsComponent(createLightSourceComponent(sourceId));
    // worldPosition must be set after addChild so the parent transform applies.
    source.worldPosition = position;
}

describe("illuminationBandAt", () => {
    it("lets phase decide whether placed sources matter", () => {
        // Daylight is a free global light, so by day every tile is bright no
        // matter the sources. At dusk and night that light is gone and tiles
        // fall back to whatever the brazier reaches. With one fixed source, the
        // near tile stays bright in every phase while the far tile only goes
        // dark once the sun is down.
        const phaseExpectations: Array<{ phase: Phase; farBand: string }> = [
            { phase: "dawn", farBand: "bright" },
            { phase: "day", farBand: "bright" },
            { phase: "dusk", farBand: "dark" },
            { phase: "night", farBand: "dark" },
        ];

        for (const { phase, farBand } of phaseExpectations) {
            const root = makeWorld(phase);
            addSource(root, "brazier", "brazier", { x: 12, y: 8 });

            assert.strictEqual(
                illuminationBandAt(root, { x: 14, y: 8 }),
                "bright",
                `near tile should be bright at ${phase}`,
            );
            assert.strictEqual(
                illuminationBandAt(root, { x: 17, y: 8 }),
                farBand,
                `far tile should be ${farBand} at ${phase}`,
            );
        }
    });

    it("bands a single brazier at night by squared distance", () => {
        const root = makeWorld("night");
        addSource(root, "brazier", "brazier", { x: 12, y: 8 });

        assert.strictEqual(illuminationBandAt(root, { x: 12, y: 8 }), "bright");
        assert.strictEqual(illuminationBandAt(root, { x: 14, y: 8 }), "bright");
        assert.strictEqual(illuminationBandAt(root, { x: 15, y: 8 }), "dim");
        assert.strictEqual(illuminationBandAt(root, { x: 16, y: 8 }), "dim");
        assert.strictEqual(illuminationBandAt(root, { x: 17, y: 8 }), "dark");

        // Diagonal: offset (2,2) is squared distance 8, outside the bright
        // radius (4) but inside dim (16). A Chebyshev/Manhattan metric would
        // wrongly call this bright, so this locks the bright ring to squared
        // Euclidean distance.
        assert.strictEqual(illuminationBandAt(root, { x: 14, y: 10 }), "dim");
    });

    it("takes the brightest band across overlapping sources, never summing", () => {
        const root = makeWorld("night");
        addSource(root, "a", "brazier", { x: 12, y: 8 });
        addSource(root, "b", "brazier", { x: 20, y: 8 });

        // Midpoint sits in the dim ring of both braziers (distance 4 from each).
        // Two dim rings must not add up to bright.
        assert.strictEqual(illuminationBandAt(root, { x: 16, y: 8 }), "dim");

        // A tile inside one brazier's bright radius is bright regardless of the
        // other's dim ring reaching it.
        assert.strictEqual(illuminationBandAt(root, { x: 13, y: 8 }), "bright");
    });

    it("lights only a building's own tile and cardinal neighbours at night", () => {
        const root = makeWorld("night");
        addSource(root, "house", "buildingGlow", { x: 12, y: 8 });

        // Own tile and cardinal neighbours are dim, never bright.
        assert.strictEqual(illuminationBandAt(root, { x: 12, y: 8 }), "dim");
        assert.strictEqual(illuminationBandAt(root, { x: 13, y: 8 }), "dim");
        assert.strictEqual(illuminationBandAt(root, { x: 12, y: 9 }), "dim");

        // Diagonal (squared distance 2 > dim radius 1) and two tiles out are dark.
        assert.strictEqual(illuminationBandAt(root, { x: 13, y: 9 }), "dark");
        assert.strictEqual(illuminationBandAt(root, { x: 14, y: 8 }), "dark");
    });
});
