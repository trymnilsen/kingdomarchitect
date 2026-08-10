import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../src/game/entity/entity.ts";
import { makeNumberId, type Point } from "../../src/common/point.ts";
import type { InventoryItem } from "../../src/data/inventory/inventoryItem.ts";
import { createEquipmentComponent } from "../../src/game/component/equipmentComponent.ts";
import { createLightSourceComponent } from "../../src/game/component/lightSourceComponent.ts";
import { createPlayerKingdomComponent } from "../../src/game/component/playerKingdomComponent.ts";
import {
    collectLightClaims,
    computeLitTiles,
} from "../../src/game/light/lightClaims.ts";
import {
    computeHearthlight,
    isInHearthlight,
} from "../../src/game/light/hearthlight.ts";
import { getLightSourceDefinition } from "../../src/data/light/lightSourceDefinition.ts";
import { inventoryItems } from "../../src/data/inventory/inventoryItems.ts";
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
    worker.setEcsComponent(createLightSourceComponent("workerGlow"));
    worker.worldPosition = position;
    return root;
}

function litAt(litTiles: ReadonlySet<number>, x: number, y: number): boolean {
    return litTiles.has(makeNumberId(x, y));
}

describe("carried light", () => {
    it("lights the ring around its holder instead of the bare glow tile", () => {
        const root = kingdomWithTorchbearer({ x: 12, y: 8 });

        const lit = computeLitTiles(collectLightClaims(root, "illumination"));

        assert.strictEqual(litAt(lit, 12, 8), true, "own tile");
        assert.strictEqual(litAt(lit, 13, 8), true, "cardinal neighbour");
        assert.strictEqual(litAt(lit, 12, 7), true, "cardinal neighbour");
        // Radius 1 is a disc, so diagonals stay dark and the ring stops there.
        assert.strictEqual(litAt(lit, 13, 9), false, "diagonal");
        assert.strictEqual(litAt(lit, 14, 8), false, "two tiles out");
        // Without the torch this worker would light exactly one tile.
        assert.strictEqual(lit.size, 5);
    });

    it("claims no hearthlight, so territory cannot follow feet", () => {
        const root = kingdomWithTorchbearer({ x: 12, y: 8 });

        const hearth = computeLitTiles(collectLightClaims(root, "hearthlight"));

        assert.strictEqual(hearth.size, 0);
    });

    it("leaves a lone torchbearer outside hearthlight for the defender gate", () => {
        // The hearth defense system gates defenders on standing inside
        // hearthlight. A worker must not be able to satisfy that gate simply
        // by carrying their own light into the wilderness.
        const root = kingdomWithTorchbearer({ x: 26, y: 14 });

        const hearth = computeHearthlight(root);

        assert.strictEqual(isInHearthlight(hearth, { x: 26, y: 14 }), false);
        assert.strictEqual(isInHearthlight(hearth, { x: 27, y: 14 }), false);
    });

    it("never claims hearthlight, for every light-granting item there is", () => {
        // This is what turns "carried light never claims" from a convention
        // into something CI enforces. Every item that grants light is checked,
        // so a new lantern or relic cannot quietly opt into claiming. If a
        // claiming carried light is ever deliberately designed, delete this
        // test knowingly rather than weakening it.
        const lightItems = (inventoryItems as readonly InventoryItem[]).filter(
            (item): item is InventoryItem & { light: string } =>
                item.light !== undefined,
        );
        assert.ok(lightItems.length > 0, "there is at least one to check");

        for (const item of lightItems) {
            const definition = getLightSourceDefinition(item.light);
            assert.ok(definition, `${item.id} names a real light definition`);
            assert.strictEqual(
                definition.claimsHearthlight,
                false,
                `${item.id} must not claim hearthlight`,
            );
        }
    });
});
