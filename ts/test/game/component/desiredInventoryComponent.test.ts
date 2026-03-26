import assert from "node:assert";
import { describe, it } from "node:test";
import {
    createDesiredInventoryComponent,
    getInventoryDeficit,
} from "../../../src/game/component/desiredInventoryComponent.ts";
import {
    createInventoryComponent,
    addInventoryItem,
} from "../../../src/game/component/inventoryComponent.ts";
import { wheatResourceItem, breadItem } from "../../../src/data/inventory/items/resources.ts";

describe("desiredInventoryComponent", () => {
    describe("getInventoryDeficit", () => {
        it("returns empty when inventory meets all desired amounts", () => {
            const desired = createDesiredInventoryComponent([
                { itemId: breadItem.id, amount: 2 },
            ]);
            const actual = createInventoryComponent();
            addInventoryItem(actual, breadItem, 2);

            const deficit = getInventoryDeficit(desired, actual);
            assert.strictEqual(deficit.length, 0);
        });

        it("returns empty when inventory exceeds desired amounts", () => {
            const desired = createDesiredInventoryComponent([
                { itemId: breadItem.id, amount: 2 },
            ]);
            const actual = createInventoryComponent();
            addInventoryItem(actual, breadItem, 5);

            const deficit = getInventoryDeficit(desired, actual);
            assert.strictEqual(deficit.length, 0);
        });

        it("returns entry with difference when inventory has partial amount", () => {
            const desired = createDesiredInventoryComponent([
                { itemId: breadItem.id, amount: 3 },
            ]);
            const actual = createInventoryComponent();
            addInventoryItem(actual, breadItem, 1);

            const deficit = getInventoryDeficit(desired, actual);
            assert.strictEqual(deficit.length, 1);
            assert.strictEqual(deficit[0].itemId, breadItem.id);
            assert.strictEqual(deficit[0].amount, 2);
        });

        it("returns full desired amount when item is missing entirely", () => {
            const desired = createDesiredInventoryComponent([
                { itemId: breadItem.id, amount: 3 },
            ]);
            const actual = createInventoryComponent();

            const deficit = getInventoryDeficit(desired, actual);
            assert.strictEqual(deficit.length, 1);
            assert.strictEqual(deficit[0].amount, 3);
        });

        it("excludes fully stocked items from deficit results", () => {
            const desired = createDesiredInventoryComponent([
                { itemId: breadItem.id, amount: 2 },
                { itemId: wheatResourceItem.id, amount: 4 },
            ]);
            const actual = createInventoryComponent();
            addInventoryItem(actual, breadItem, 2);
            addInventoryItem(actual, wheatResourceItem, 1);

            const deficit = getInventoryDeficit(desired, actual);
            assert.strictEqual(deficit.length, 1);
            assert.strictEqual(deficit[0].itemId, wheatResourceItem.id);
            assert.strictEqual(deficit[0].amount, 3);
        });
    });
});
