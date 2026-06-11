import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createVisibilityComponent } from "../../../src/game/component/visibilityComponent.ts";
import { stampPerceptionFloor } from "../../../src/game/vision/revealFootprint.ts";
import type { LightBand } from "../../../src/game/light/lightBand.ts";
import { makeNumberId, type Point } from "../../../src/common/point.ts";

/**
 * stampPerceptionFloor writes the per-frame perception floor the perceived-band
 * rule reads. These cases pin its three properties: the stamped footprint is
 * exactly the perception diamond at the viewer's position, viewers without
 * minimal perception stamp nothing, and overlapping viewers merge by brightest
 * band rather than last-writer-wins.
 */
describe("stampPerceptionFloor", () => {
    function makeViewer(
        root: Entity,
        id: string,
        position: Point,
        perception?: { radius: number; band: LightBand },
    ): Entity {
        const viewer = new Entity(id);
        root.addChild(viewer);
        viewer.setEcsComponent(createVisibilityComponent(2, perception));
        // worldPosition must be set after addChild so the parent transform applies.
        viewer.worldPosition = position;
        return viewer;
    }

    it("stamps exactly the cardinal plus for a radius-1 dim perception", () => {
        const root = new Entity("root");
        const viewer = makeViewer(
            root,
            "v",
            { x: 12, y: 8 },
            { radius: 1, band: "dim" },
        );
        const floor = new Map<number, LightBand>();

        stampPerceptionFloor(viewer, floor);

        const expected: Point[] = [
            { x: 12, y: 8 },
            { x: 11, y: 8 },
            { x: 13, y: 8 },
            { x: 12, y: 7 },
            { x: 12, y: 9 },
        ];
        assert.strictEqual(floor.size, expected.length);
        for (const point of expected) {
            assert.strictEqual(
                floor.get(makeNumberId(point.x, point.y)),
                "dim",
                `(${point.x},${point.y}) should floor at dim`,
            );
        }
    });

    it("stamps nothing for a viewer without minimal perception", () => {
        const root = new Entity("root");
        const viewer = makeViewer(root, "v", { x: 12, y: 8 });
        const floor = new Map<number, LightBand>();

        stampPerceptionFloor(viewer, floor);

        assert.strictEqual(floor.size, 0);
    });

    it("keeps the brightest band where overlapping viewers disagree", () => {
        const root = new Entity("root");
        // Both viewers floor the shared tile (12,8): one dim, one bright. The
        // shared tile must read bright whichever stamps first.
        const dimViewer = makeViewer(
            root,
            "dim",
            { x: 12, y: 8 },
            { radius: 1, band: "dim" },
        );
        const brightViewer = makeViewer(
            root,
            "bright",
            { x: 13, y: 8 },
            { radius: 1, band: "bright" },
        );
        const sharedTile = makeNumberId(12, 8);

        const dimFirst = new Map<number, LightBand>();
        stampPerceptionFloor(dimViewer, dimFirst);
        stampPerceptionFloor(brightViewer, dimFirst);
        assert.strictEqual(dimFirst.get(sharedTile), "bright");

        const brightFirst = new Map<number, LightBand>();
        stampPerceptionFloor(brightViewer, brightFirst);
        stampPerceptionFloor(dimViewer, brightFirst);
        assert.strictEqual(brightFirst.get(sharedTile), "bright");
    });
});
