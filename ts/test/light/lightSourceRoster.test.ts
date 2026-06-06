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
import { getLightSourceDefinition } from "../../src/data/light/lightSourceDefinition.ts";

function makeNightWorld(): Entity {
    const root = new Entity("root");
    const day = createDayComponent();
    day.phase = "night" as Phase;
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

describe("Stage 2 light source roster", () => {
    it("keeps every source's bright band inside its dim band", () => {
        // bright is the inner ring, so it can never exceed dim. This guards the
        // data contract against a transposed radius pair — torch (1/1) is the
        // edge case where the two are deliberately equal.
        for (const id of ["torch", "campfire", "lampPost"]) {
            const definition = getLightSourceDefinition(id);
            assert.ok(definition, `${id} should resolve`);
            assert.ok(
                definition!.brightRadius <= definition!.dimRadius,
                `${id} bright radius must not exceed dim radius`,
            );
        }
    });

    it("bands a torch to its own tile and cardinal neighbours only (1/1)", () => {
        const root = makeNightWorld();
        addSource(root, "t", "torch", { x: 12, y: 8 });

        // Own tile and cardinal neighbour (squared distance 0 and 1) are bright.
        // This is the only source whose bright and dim radii coincide, so it is
        // the one case proving the field behaves when the two bands are equal.
        assert.strictEqual(illuminationBandAt(root, { x: 12, y: 8 }), "bright");
        assert.strictEqual(illuminationBandAt(root, { x: 13, y: 8 }), "bright");
        // Diagonal (squared distance 2) and two tiles out (4) fall outside both
        // radii and read dark.
        assert.strictEqual(illuminationBandAt(root, { x: 13, y: 9 }), "dark");
        assert.strictEqual(illuminationBandAt(root, { x: 14, y: 8 }), "dark");
    });
});
