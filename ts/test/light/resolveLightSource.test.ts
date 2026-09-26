import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../src/game/entity/entity.ts";
import type { InventoryItem } from "../../src/data/inventory/inventoryItem.ts";
import { createEquipmentComponent } from "../../src/game/component/equipmentComponent.ts";
import {
    createLightSourceComponent,
    LightSourceComponentId,
} from "../../src/game/component/lightSourceComponent.ts";
import { resolveLightSource } from "../../src/game/light/resolveLightSource.ts";
import { spriteRefs } from "../../src/asset/sprite.ts";
import { torchItem } from "../../src/data/inventory/items/equipment.ts";
import {
    lampPostLightSource,
    workerGlowLightSource,
} from "../../src/data/light/lightSourceDefinition.ts";

/**
 * A worker-shaped entity: it carries the presence glow as its own profile and
 * has hands, so what it emits depends on what is in them.
 */
function makeWorker(
    primary: InventoryItem | null = null,
    secondary: InventoryItem | null = null,
): Entity {
    const worker = new Entity("worker");
    const equipment = createEquipmentComponent();
    equipment.slots.primary = primary;
    equipment.slots.secondary = secondary;
    worker.setEcsComponent(equipment);
    worker.setEcsComponent(
        createLightSourceComponent(workerGlowLightSource.id, false),
    );
    return worker;
}

function lightOf(entity: Entity) {
    const source = entity.requireEcsComponent(LightSourceComponentId);
    return resolveLightSource(entity, source);
}

/** A prop that emits a wide light, so "brightest wins" has something to win. */
const wideLightInHand: InventoryItem = {
    id: "testWideLightProp",
    name: "Wide Light Prop",
    asset: spriteRefs.empty_sprite,
    light: lampPostLightSource.id,
};

describe("resolveLightSource", () => {
    it("takes the brightest when both hands hold a light", () => {
        const definition = lightOf(makeWorker(torchItem, wideLightInHand));

        // Lit-ness is binary, so two lights do not add. The wider one wins.
        assert.strictEqual(definition?.id, lampPostLightSource.id);
        assert.strictEqual(definition?.lightRadius, 4);
    });
});
