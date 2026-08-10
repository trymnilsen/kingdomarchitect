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
    brazierLightSource,
    cressetLightSource,
    torchLightSource,
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
        createLightSourceComponent(workerGlowLightSource.id),
    );
    return worker;
}

function lightOf(entity: Entity) {
    const source = entity.requireEcsComponent(LightSourceComponentId);
    return resolveLightSource(entity, source);
}

const brazierInHand: InventoryItem = {
    id: "testBrazierProp",
    name: "Brazier Prop",
    asset: spriteRefs.empty_sprite,
    light: brazierLightSource.id,
};

const brokenLightItem: InventoryItem = {
    id: "testBrokenLight",
    name: "Broken Light",
    asset: spriteRefs.empty_sprite,
    light: "noSuchLightSource",
};

describe("resolveLightSource", () => {
    it("falls back to the entity's own profile with empty hands", () => {
        const definition = lightOf(makeWorker());

        assert.strictEqual(definition?.id, workerGlowLightSource.id);
        assert.strictEqual(definition?.lightRadius, 0);
    });

    it("emits the carried light of a torch in the secondary slot", () => {
        const definition = lightOf(makeWorker(null, torchItem));

        assert.strictEqual(definition?.id, torchLightSource.id);
        assert.strictEqual(definition?.lightRadius, 1);
    });

    it("takes the brightest when both hands hold a light", () => {
        const definition = lightOf(makeWorker(torchItem, brazierInHand));

        // Lit-ness is binary, so two lights do not add. The wider one wins.
        assert.strictEqual(definition?.id, brazierLightSource.id);
        assert.strictEqual(definition?.lightRadius, 4);
    });

    it("skips an item naming a light that does not exist", () => {
        // A stale id must degrade to the entity's own profile rather than
        // darkening a worker that is visibly holding something.
        const definition = lightOf(makeWorker(brokenLightItem));

        assert.strictEqual(definition?.id, workerGlowLightSource.id);
    });

    it("ignores equipped items that grant no light", () => {
        const plainItem: InventoryItem = {
            id: "testPlank",
            name: "Plank",
            asset: spriteRefs.empty_sprite,
        };

        assert.strictEqual(
            lightOf(makeWorker(plainItem))?.id,
            workerGlowLightSource.id,
        );
    });

    it("reads a building's own profile, having no equipment at all", () => {
        const building = new Entity("cressetBuilding");
        building.setEcsComponent(
            createLightSourceComponent(cressetLightSource.id),
        );

        assert.strictEqual(lightOf(building)?.id, cressetLightSource.id);
    });
});
