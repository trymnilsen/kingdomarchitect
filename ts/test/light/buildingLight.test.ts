import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../src/game/entity/entity.ts";
import type { Point } from "../../src/common/point.ts";
import { createDayComponent } from "../../src/game/component/dayComponent.ts";
import { buildingPrefab } from "../../src/game/prefab/buildingPrefab.ts";
import { illuminationBandAt } from "../../src/game/light/illumination.ts";
import { woodenHouse } from "../../src/data/building/wood/house.ts";
import { brazier } from "../../src/data/building/wood/brazier.ts";
import type { Building } from "../../src/data/building/building.ts";
import { emptySpriteRef } from "../../src/asset/sprite.ts";

const unlitBuilding: Building = {
    id: "testUnlitBuilding",
    icon: emptySpriteRef,
    name: "Unlit",
    scale: 1,
    light: "none",
};

/**
 * Builds a night world and places a prefab building in it, returning the root so
 * the illumination field can be queried. This exercises the whole chain:
 * buildingPrefab attaching a light source, collectLightEmitters finding it, and
 * illuminationBandAt deriving the band.
 */
function placeBuildingAtNight(
    building: Building,
    scaffolded: boolean,
    position: Point,
): Entity {
    const root = new Entity("root");
    const day = createDayComponent();
    day.phase = "night";
    root.setEcsComponent(day);

    const entity = buildingPrefab(building, scaffolded);
    root.addChild(entity);
    // worldPosition must be set after addChild so the parent transform applies.
    entity.worldPosition = position;
    return root;
}

describe("building light at night", () => {
    it("gives a completed ordinary building a faint dim self-glow", () => {
        const root = placeBuildingAtNight(woodenHouse, false, { x: 12, y: 8 });

        // Own tile and cardinal neighbour are dim; nothing reads bright and the
        // glow does not reach two tiles out.
        assert.strictEqual(illuminationBandAt(root, { x: 12, y: 8 }), "dim");
        assert.strictEqual(illuminationBandAt(root, { x: 13, y: 8 }), "dim");
        assert.strictEqual(illuminationBandAt(root, { x: 14, y: 8 }), "dark");
    });

    it("lets a dedicated light-source building cast a bright pool", () => {
        const root = placeBuildingAtNight(brazier, false, { x: 12, y: 8 });

        // A bright ring can only come from the brazier profile, so this proves
        // building.light is honoured rather than the default dim-only glow.
        assert.strictEqual(illuminationBandAt(root, { x: 14, y: 8 }), "bright");
    });

    it("emits no light when the building opts out with \"none\"", () => {
        const root = placeBuildingAtNight(unlitBuilding, false, { x: 12, y: 8 });

        assert.strictEqual(illuminationBandAt(root, { x: 12, y: 8 }), "dark");
    });

    it("does not light an unbuilt scaffolded foundation", () => {
        const root = placeBuildingAtNight(woodenHouse, true, { x: 12, y: 8 });

        assert.strictEqual(illuminationBandAt(root, { x: 12, y: 8 }), "dark");
    });
});
