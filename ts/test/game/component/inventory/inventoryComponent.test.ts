import { describe, it, expect } from "vitest";
import { InventoryComponent2 } from "../../../../src/game/componentOld/inventory/inventoryComponent.js";
import {
    stoneResource,
    woodResourceItem,
} from "../../../../src/data/inventory/items/resources.js";

describe("InventoryComponent", () => {
    it("can get items", () => {
        const component = new InventoryComponent2();
        component.addInventoryItem(woodResourceItem, 2);
        component.addInventoryItem(stoneResource, 5);

        const items = component.items;
        const hasWoodResource = items.some(
            (item) => item.item.id == woodResourceItem.id && item.amount == 2,
        );

        const hasStoneResource = items.some(
            (item) => item.item.id == stoneResource.id && item.amount == 5,
        );

        expect(items.length).toBe(2);
        expect(hasWoodResource).toBe(true);
        expect(hasStoneResource).toBe(true);
    });

    it("adding inventory item to existing entry", () => {
        const component = new InventoryComponent2();
        component.addInventoryItem(woodResourceItem, 2);
        component.addInventoryItem(stoneResource, 5);
        component.addInventoryItem(woodResourceItem, 6);

        const items = component.items;
        const hasWoodResource = items.some(
            (item) => item.item.id == woodResourceItem.id && item.amount == 8,
        );

        expect(items.length).toBe(2);
        expect(hasWoodResource).toBe(true);
    });

    it("cannot add items with negative amount", () => {
        const component = new InventoryComponent2();
        expect(() => {
            component.addInventoryItem(woodResourceItem, -2);
        }).toThrow();
    });

    it("remove full partial amount from inventory item", () => {
        const component = new InventoryComponent2();
        component.addInventoryItem(woodResourceItem, 7);
        const removeResult = component.removeInventoryItem(
            woodResourceItem.id,
            3,
        );
        const woodEntry = component.items[0];
        expect(removeResult).toBe(true);
        expect(woodEntry.amount).toBe(4);
    });

    it("attempt to remove more than available amount fails", () => {
        const component = new InventoryComponent2();
        component.addInventoryItem(woodResourceItem, 7);
        const removeResult = component.removeInventoryItem(
            woodResourceItem.id,
            8,
        );
        const woodEntry = component.items[0];
        expect(removeResult).toBe(false);
        expect(woodEntry.amount).toBe(7);
    });

    it("adds inventory item to group with equal tags", () => {
        const component = new InventoryComponent2();
        component.addInventoryItem(woodResourceItem, 2, "input");
        component.addInventoryItem(woodResourceItem, 5, "output");

        const items = component.items;
        const inputItems = items.some(
            (item) =>
                item.item.id == woodResourceItem.id &&
                item.amount == 2 &&
                item.tag == "input",
        );

        const outputItems = items.some(
            (item) =>
                item.item.id == woodResourceItem.id &&
                item.amount == 5 &&
                item.tag == "output",
        );

        expect(items.length).toBe(2);
        expect(inputItems).toBe(true);
        expect(outputItems).toBe(true);
    });

    it("adding without tag does not add to tagged group", () => {
        const component = new InventoryComponent2();
        component.addInventoryItem(woodResourceItem, 2, "output");
        component.addInventoryItem(woodResourceItem, 5);

        const items = component.items;
        const nonTagged = items.some(
            (item) =>
                item.item.id == woodResourceItem.id &&
                item.amount == 2 &&
                item.tag == "output",
        );

        const outputItems = items.some(
            (item) =>
                item.item.id == woodResourceItem.id &&
                item.amount == 5 &&
                item.tag === undefined,
        );

        expect(items.length).toBe(2);
        expect(nonTagged).toBe(true);
        expect(outputItems).toBe(true);
    });

    it("amount of should only count with same tag if provided", () => {
        const component = new InventoryComponent2();
        component.addInventoryItem(woodResourceItem, 2, "output");
        component.addInventoryItem(woodResourceItem, 5);

        expect(component.amountOf(woodResourceItem.id, "output")).toBe(2);
    });

    it("amount of without tag should count across all tags", () => {
        const component = new InventoryComponent2();
        component.addInventoryItem(woodResourceItem, 2, "output");
        component.addInventoryItem(woodResourceItem, 5);

        expect(component.amountOf(woodResourceItem.id)).toBe(7);
    });

    it("remove with tag should only remove with equal tag", () => {
        const component = new InventoryComponent2();
        component.addInventoryItem(woodResourceItem, 2, "output");
        component.addInventoryItem(woodResourceItem, 5);

        component.removeInventoryItem(woodResourceItem.id, 2, "output");
        expect(component.amountOf(woodResourceItem.id)).toBe(5);
    });
});
