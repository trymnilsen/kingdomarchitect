import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { createDepositHeldBehavior } from "../../../../src/game/behavior/behaviors/DepositHeldBehavior.ts";
import { executeDepositToStockpileAction } from "../../../../src/game/behavior/actions/depositToStockpileAction.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
    isHeldEmpty,
} from "../../../../src/game/component/heldItemComponent.ts";
import {
    addInventoryItem,
    createInventoryComponent,
    getInventoryItem,
    InventoryComponentId,
} from "../../../../src/game/component/inventoryComponent.ts";
import { createStockpileComponent } from "../../../../src/game/component/stockpileComponent.ts";
import { createPlayerKingdomComponent } from "../../../../src/game/component/playerKingdomComponent.ts";
import { treeResource } from "../../../../src/data/inventory/items/naturalResource.ts";
import { stockPile } from "../../../../src/data/building/wood/storage.ts";
import { woodResourceItem } from "../../../../src/data/inventory/items/resources.ts";

function settlementWithStockpile(capacity: number, prefill: number) {
    const settlement = new Entity("settlement");
    settlement.setEcsComponent(createPlayerKingdomComponent());

    const store = new Entity("store");
    store.setEcsComponent(createStockpileComponent(capacity));
    const inventory = createInventoryComponent();
    store.setEcsComponent(inventory);
    settlement.addChild(store);
    store.worldPosition = { x: 18, y: 5 };
    if (prefill > 0) {
        addInventoryItem(inventory, woodResourceItem, prefill);
    }

    const worker = new Entity("worker");
    worker.setEcsComponent(createHeldItemComponent());
    settlement.addChild(worker);
    worker.worldPosition = { x: 14, y: 5 };

    return { settlement, store, worker, inventory };
}

describe("depositing into a store with limited room", () => {
    it("leaves the overflow in hand rather than swallowing it", () => {
        // 190 of 200 used, so only 10 of the worker's 30 fit.
        const { store, worker, inventory } = settlementWithStockpile(200, 190);
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 30;

        executeDepositToStockpileAction(
            { type: "depositToStockpile", stockpileId: store.id },
            worker,
        );

        assert.strictEqual(getInventoryItem(inventory, "wood")?.amount, 200);
        assert.strictEqual(held.amount, 20);
        assert.strictEqual(isHeldEmpty(held), false);
    });

    it("stops the worker choosing a store with no room left", () => {
        const behavior = createDepositHeldBehavior();
        const { worker } = settlementWithStockpile(200, 200);
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 8;

        // The only store is full, so there is nowhere to take this. The worker
        // must not plan a haul it cannot complete.
        assert.strictEqual(behavior.isValid(worker), false);
        assert.deepStrictEqual(behavior.expand(worker), []);
    });

    it("keeps a starting settlement able to bank what it chops", () => {
        // The real shape of the early game: one stockpile, no warehouse, and a
        // worker felling trees. If a handful of trees fills the only store, the
        // player silently stops being able to haul with nothing explaining why.
        const treeYield = treeResource.yields[0].amount;
        const capacity = stockPile.storageCapacity!;
        const treesUntilFull = Math.floor(capacity / treeYield);

        assert.ok(
            treesUntilFull >= 20,
            `the starting stockpile fills after ${treesUntilFull} trees ` +
                `(${treeYield} wood each into ${capacity} capacity), which ` +
                `strands the early game`,
        );
    });

    it("holds a full build order for the costliest building", () => {
        // Materials are staged through the stockpile before they are hauled
        // into the site, so a store that cannot hold one build order can never
        // complete that building.
        const capacity = stockPile.storageCapacity!;
        assert.ok(
            capacity >= 195,
            `stockpile capacity ${capacity} cannot stage a church (195 items)`,
        );
    });
});
