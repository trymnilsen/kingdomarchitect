import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import type { Point } from "../../../src/common/point.ts";
import type { InventoryItem } from "../../../src/data/inventory/inventoryItem.ts";
import { createHaulBehavior } from "../../../src/game/behavior/behaviors/haulBehavior.ts";
import { createCollectableComponent } from "../../../src/game/component/collectableComponent.ts";
import { createGroundItemComponent } from "../../../src/game/component/groundItemComponent.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../src/game/component/heldItemComponent.ts";
import { createInventoryComponent } from "../../../src/game/component/inventoryComponent.ts";
import { createPlayerKingdomComponent } from "../../../src/game/component/playerKingdomComponent.ts";
import { buildingPrefab } from "../../../src/game/prefab/buildingPrefab.ts";
import { cresset } from "../../../src/data/building/light/cresset.ts";
import {
    createStockpileComponent,
    setPreferredAmount,
    StockpileComponentId,
} from "../../../src/game/component/stockpileComponent.ts";
import {
    createRoleComponent,
    RoleComponentId,
    WorkerRole,
} from "../../../src/game/component/worker/roleComponent.ts";
import {
    stoneResource,
    woodResourceItem,
} from "../../../src/data/inventory/items/resources.ts";

/** A cresset at (12, 8) claims a radius-2 disc of hearthlight around itself. */
const CRESSET = { x: 12, y: 8 };
const LIT = { x: 13, y: 8 };
const LIT_FARTHER = { x: 12, y: 9 };
const DARK = { x: 16, y: 8 };

type Yard = {
    root: Entity;
    store: Entity;
    hauler: Entity;
};

/**
 * A kingdom with one cresset, one stockpile that takes anything, and one
 * Hauler standing next to the light. Piles are added per test.
 */
function litYard(): Yard {
    const root = new Entity("root");
    const kingdom = new Entity("kingdom");
    kingdom.setEcsComponent(createPlayerKingdomComponent());
    root.addChild(kingdom);

    // The real prefab, because a bare light component claims nothing.
    const light = buildingPrefab(cresset, false);
    kingdom.addChild(light);
    light.worldPosition = CRESSET;

    const store = new Entity("store");
    store.setEcsComponent(createStockpileComponent(100));
    store.setEcsComponent(createInventoryComponent());
    kingdom.addChild(store);
    store.worldPosition = { x: 10, y: 8 };

    const hauler = new Entity("hauler");
    const role = createRoleComponent();
    role.role = WorkerRole.Hauler;
    hauler.setEcsComponent(role);
    hauler.setEcsComponent(createHeldItemComponent());
    kingdom.addChild(hauler);
    hauler.worldPosition = { x: 11, y: 8 };

    return { root, store, hauler };
}

function addPile(
    root: Entity,
    id: string,
    position: Point,
    item: InventoryItem,
): Entity {
    const pile = new Entity(id);
    pile.setEcsComponent(createCollectableComponent([{ item, amount: 3 }]));
    pile.setEcsComponent(createGroundItemComponent(0));
    root.addChild(pile);
    pile.worldPosition = position;
    return pile;
}

describe("haulBehavior", () => {
    const haul = createHaulBehavior();

    it("walks to a lit pile and picks it up", () => {
        const { root, hauler } = litYard();
        const pile = addPile(root, "pile", LIT, woodResourceItem);

        assert.strictEqual(haul.isValid(hauler), true);
        assert.deepStrictEqual(haul.expand(hauler), [
            { type: "moveTo", target: LIT, stopAdjacent: "cardinal" },
            { type: "pickupFromGround", pileEntityId: pile.id },
        ]);
    });

    it("leaves a pile in the dark alone", () => {
        const { root, hauler } = litYard();
        addPile(root, "pile", DARK, woodResourceItem);

        assert.strictEqual(haul.isValid(hauler), false);
    });

    it("skips a lit pile whose item no stockpile accepts", () => {
        const { root, store, hauler } = litYard();
        const stockpile = store.requireEcsComponent(StockpileComponentId);
        setPreferredAmount(stockpile, stoneResource.id, 50);
        addPile(root, "pile", LIT, woodResourceItem);

        assert.strictEqual(haul.isValid(hauler), false);
    });

    it("prefers the nearer of two lit piles", () => {
        const { root, hauler } = litYard();
        hauler.worldPosition = { x: 14, y: 8 };
        addPile(root, "far", LIT_FARTHER, woodResourceItem);
        const near = addPile(root, "near", LIT, woodResourceItem);

        const actions = haul.expand(hauler);
        assert.deepStrictEqual(actions[1], {
            type: "pickupFromGround",
            pileEntityId: near.id,
        });
    });

    it("is not valid while the hand is full, so depositHeld can take over", () => {
        const { root, hauler } = litYard();
        addPile(root, "pile", LIT, woodResourceItem);
        const held = hauler.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 2;

        assert.strictEqual(haul.isValid(hauler), false);
    });

    it("ignores piles for any role but Hauler", () => {
        const { root, hauler } = litYard();
        hauler.requireEcsComponent(RoleComponentId).role = WorkerRole.Worker;
        addPile(root, "pile", LIT, woodResourceItem);

        assert.strictEqual(haul.isValid(hauler), false);
    });
});
