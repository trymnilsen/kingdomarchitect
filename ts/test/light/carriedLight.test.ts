import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../src/game/entity/entity.ts";
import { type Point } from "../../src/common/point.ts";
import { createEquipmentComponent } from "../../src/game/component/equipmentComponent.ts";
import { createLightSourceComponent } from "../../src/game/component/lightSourceComponent.ts";
import { createPlayerKingdomComponent } from "../../src/game/component/playerKingdomComponent.ts";
import {
    collectLightClaims,
    computeLitTiles,
} from "../../src/game/light/lightClaims.ts";
import { torchItem } from "../../src/data/inventory/items/equipment.ts";

/** A player worker holding a torch, alone in the dark away from any building. */
function kingdomWithTorchbearer(position: Point): Entity {
    const root = new Entity("root");
    const kingdom = new Entity("kingdom");
    kingdom.setEcsComponent(createPlayerKingdomComponent());
    root.addChild(kingdom);

    const worker = new Entity("torchbearer");
    kingdom.addChild(worker);
    const equipment = createEquipmentComponent();
    equipment.slots.secondary = torchItem;
    worker.setEcsComponent(equipment);
    worker.setEcsComponent(createLightSourceComponent("workerGlow", false));
    worker.worldPosition = position;
    return root;
}

describe("carried light", () => {
    it("claims no hearthlight, so territory cannot follow feet", () => {
        // The worker's light is created without a claim, and equipping a
        // torch only changes what is emitted.
        const root = kingdomWithTorchbearer({ x: 12, y: 8 });

        const hearth = computeLitTiles(collectLightClaims(root, "hearthlight"));

        assert.strictEqual(hearth.size, 0);
    });
});
