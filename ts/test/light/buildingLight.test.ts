import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../src/game/entity/entity.ts";
import { makeNumberId, type Point } from "../../src/common/point.ts";
import { buildingPrefab } from "../../src/game/prefab/buildingPrefab.ts";
import {
    collectLightClaims,
    computeLitTiles,
} from "../../src/game/light/lightClaims.ts";
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
 * Places a prefab building in a bare world and derives coverage. This
 * exercises the whole chain: buildingPrefab attaching a light source,
 * collectLightClaims finding it, and computeLitTiles stamping it.
 */
function coverageWithBuilding(
    building: Building,
    scaffolded: boolean,
    position: Point,
): Set<number> {
    const root = new Entity("root");
    const entity = buildingPrefab(building, scaffolded);
    root.addChild(entity);
    // worldPosition must be set after addChild so the parent transform applies.
    entity.worldPosition = position;
    return computeLitTiles(collectLightClaims(root, "illumination"));
}

function litAt(litTiles: ReadonlySet<number>, x: number, y: number): boolean {
    return litTiles.has(makeNumberId(x, y));
}

describe("building light", () => {
    it("gives a completed ordinary building a one-tile self-glow", () => {
        const lit = coverageWithBuilding(woodenHouse, false, { x: 12, y: 8 });

        // Own tile and cardinal neighbour are lit, and the glow does not
        // reach two tiles out.
        assert.strictEqual(litAt(lit, 12, 8), true);
        assert.strictEqual(litAt(lit, 13, 8), true);
        assert.strictEqual(litAt(lit, 14, 8), false);
    });

    it("lets a dedicated light-source building cast a wide pool", () => {
        const lit = coverageWithBuilding(brazier, false, { x: 12, y: 8 });

        // Four tiles out can only come from the brazier profile, so this
        // proves building.light is honoured rather than the default glow.
        assert.strictEqual(litAt(lit, 16, 8), true);
    });

    it('emits no light when the building opts out with "none"', () => {
        const lit = coverageWithBuilding(unlitBuilding, false, { x: 12, y: 8 });

        assert.strictEqual(lit.size, 0);
    });

    it("does not light an unbuilt scaffolded foundation", () => {
        const lit = coverageWithBuilding(woodenHouse, true, { x: 12, y: 8 });

        assert.strictEqual(lit.size, 0);
    });
});
