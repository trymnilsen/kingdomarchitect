import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../src/game/entity/entity.ts";
import type { Point } from "../../src/common/point.ts";
import { createLightSourceComponent } from "../../src/game/component/lightSourceComponent.ts";
import { createPlayerKingdomComponent } from "../../src/game/component/playerKingdomComponent.ts";
import { createDayComponent } from "../../src/game/component/dayComponent.ts";
import {
    computeHearthlight,
    isInHearthlight,
} from "../../src/game/light/hearthlight.ts";

function worldWithTorch(torchPosition: Point): Entity {
    const root = new Entity("root");
    const kingdom = new Entity("kingdom");
    kingdom.setEcsComponent(createPlayerKingdomComponent());
    root.addChild(kingdom);
    const torch = new Entity("torch");
    kingdom.addChild(torch);
    torch.setEcsComponent(createLightSourceComponent("torch"));
    torch.worldPosition = torchPosition;
    return root;
}

describe("hearthlight", () => {
    it("contains a player torch pool and nothing beyond it", () => {
        const root = worldWithTorch({ x: 12, y: 8 });
        const hearth = computeHearthlight(root);

        assert.strictEqual(isInHearthlight(hearth, { x: 12, y: 8 }), true);
        assert.strictEqual(isInHearthlight(hearth, { x: 13, y: 8 }), true);
        // The diagonal neighbour is outside a radius-1 disc.
        assert.strictEqual(isInHearthlight(hearth, { x: 13, y: 9 }), false);
        assert.strictEqual(isInHearthlight(hearth, { x: 16, y: 8 }), false);
    });

    it("is identical at noon and at night", () => {
        // Hearthlight has no phase term. The sky's light is not the
        // kingdom's, so the claim set must not change with the phase.
        const root = worldWithTorch({ x: 12, y: 8 });
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
