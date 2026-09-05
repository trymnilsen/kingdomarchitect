import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../src/game/entity/entity.ts";
import type { Point } from "../../src/common/point.ts";
import type { Building } from "../../src/data/building/building.ts";
import { createLightSourceComponent } from "../../src/game/component/lightSourceComponent.ts";
import { createPlayerKingdomComponent } from "../../src/game/component/playerKingdomComponent.ts";
import { createDayComponent } from "../../src/game/component/dayComponent.ts";
import {
    applyFunctionalComponents,
    buildingPrefab,
} from "../../src/game/prefab/buildingPrefab.ts";
import { woodenHouse } from "../../src/data/building/wood/house.ts";
import { cresset } from "../../src/data/building/light/cresset.ts";
import {
    computeHearthlight,
    isInHearthlight,
} from "../../src/game/light/hearthlight.ts";

function playerKingdom(): { root: Entity; kingdom: Entity } {
    const root = new Entity("root");
    const kingdom = new Entity("kingdom");
    kingdom.setEcsComponent(createPlayerKingdomComponent());
    root.addChild(kingdom);
    return { root, kingdom };
}

/** A completed building through the real prefab, so it carries its own light. */
function addBuilding(kingdom: Entity, building: Building, position: Point) {
    const entity = buildingPrefab(building, false);
    kingdom.addChild(entity);
    entity.worldPosition = position;
}

describe("hearthlight", () => {
    it("is claimed by an ordinary building on its own tile and cardinals", () => {
        const { root, kingdom } = playerKingdom();
        addBuilding(kingdom, woodenHouse, { x: 12, y: 8 });

        const hearth = computeHearthlight(root);

        assert.strictEqual(isInHearthlight(hearth, { x: 12, y: 8 }), true);
        assert.strictEqual(isInHearthlight(hearth, { x: 13, y: 8 }), true);
        assert.strictEqual(isInHearthlight(hearth, { x: 12, y: 7 }), true);
        // The diagonal neighbour is outside a radius-1 disc.
        assert.strictEqual(isInHearthlight(hearth, { x: 13, y: 9 }), false);
        assert.strictEqual(isInHearthlight(hearth, { x: 14, y: 8 }), false);
        assert.strictEqual(hearth.size, 5);
    });

    it("reaches further from a placed cresset than from a plain building", () => {
        const { root, kingdom } = playerKingdom();
        addBuilding(kingdom, cresset, { x: 12, y: 8 });

        const hearth = computeHearthlight(root);

        // Two tiles out is cresset-only reach. A house stops at one.
        assert.strictEqual(isInHearthlight(hearth, { x: 14, y: 8 }), true);
        assert.strictEqual(isInHearthlight(hearth, { x: 15, y: 8 }), false);
    });

    it("is claimed only once construction finishes", () => {
        const { root, kingdom } = playerKingdom();
        const site = buildingPrefab(woodenHouse, true);
        kingdom.addChild(site);
        site.worldPosition = { x: 12, y: 8 };

        assert.strictEqual(computeHearthlight(root).size, 0, "foundation");

        // The same path the build system takes when the last material lands.
        applyFunctionalComponents(site, woodenHouse);

        const hearth = computeHearthlight(root);
        assert.strictEqual(isInHearthlight(hearth, { x: 12, y: 8 }), true);
        assert.strictEqual(hearth.size, 5);
    });

    it("is not claimed by a player light created without a claim", () => {
        const { root, kingdom } = playerKingdom();
        const lantern = new Entity("loose-light");
        kingdom.addChild(lantern);
        lantern.setEcsComponent(createLightSourceComponent("lampPost", false));
        lantern.worldPosition = { x: 12, y: 8 };

        const hearth = computeHearthlight(root);

        assert.strictEqual(hearth.size, 0);
    });

    it("is identical at noon and at night", () => {
        // Hearthlight has no phase term. The sky's light is not the
        // kingdom's, so the claim set must not change with the phase.
        const { root, kingdom } = playerKingdom();
        addBuilding(kingdom, cresset, { x: 12, y: 8 });
        const day = createDayComponent();
        day.phase = "day";
        root.setEcsComponent(day);
        const atNoon = computeHearthlight(root);

        day.phase = "night";
        const atNight = computeHearthlight(root);

        assert.deepStrictEqual([...atNoon].sort(), [...atNight].sort());
        assert.ok(atNoon.size > 0);
    });
});
