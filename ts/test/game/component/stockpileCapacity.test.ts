import assert from "node:assert";
import { describe, it } from "node:test";
import { woodResourceItem } from "../../../src/data/inventory/items/resources.ts";
import {
    addInventoryItem,
    createInventoryComponent,
} from "../../../src/game/component/inventoryComponent.ts";
import {
    createStockpileComponent,
    getStockpileFreeSpace,
    getStockpileUsedSpace,
} from "../../../src/game/component/stockpileComponent.ts";
import { berryItem } from "../../../src/data/inventory/items/resources.ts";

describe("stockpile capacity", () => {
    it("counts space across every stack rather than per item", () => {
        const inventory = createInventoryComponent();
        addInventoryItem(inventory, woodResourceItem, 30);
        addInventoryItem(inventory, berryItem, 12);

        assert.strictEqual(getStockpileUsedSpace(inventory), 42);
    });

    it("reports the room left against capacity", () => {
        const inventory = createInventoryComponent();
        addInventoryItem(inventory, woodResourceItem, 180);
        const stockpile = createStockpileComponent(200);

        assert.strictEqual(getStockpileFreeSpace(stockpile, inventory), 20);
    });

    it("clamps free space at zero when overfilled", () => {
        // Capacity can be crossed by a store that was filled before its cap
        // changed. Free space must not go negative, or a deposit would compute
        // a negative amount and quietly remove items.
        const inventory = createInventoryComponent();
        addInventoryItem(inventory, woodResourceItem, 250);
        const stockpile = createStockpileComponent(200);

        assert.strictEqual(getStockpileFreeSpace(stockpile, inventory), 0);
    });
});
