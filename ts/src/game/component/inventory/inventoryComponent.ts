import {
    hammerItem,
    swordItem,
} from "../../../data/inventory/items/equipment.js";
import { InventoryItem } from "../../../data/inventory/inventoryItem.js";
import {
    InventoryItemList,
    InventoryItemQuantity,
} from "../../../data/inventory/inventoryItemQuantity.js";
import {
    bagOfGlitter,
    blueBook,
    gemResource,
    goldCoins,
    healthPotion,
    manaPotion,
    scroll,
    stoneResource,
    wheatResourceItem,
    woodResourceItem,
} from "../../../data/inventory/items/resources.js";
import { EntityComponent } from "../entityComponent.js";
import { removeItem } from "../../../common/array.js";

export class InventoryComponent2 extends EntityComponent {
    private _items: InventoryItemQuantity[] = [];
    private _isCollectable: boolean = false;

    get isCollectable(): boolean {
        return this._isCollectable;
    }

    set isCollectable(value: boolean) {
        this._isCollectable = value;
    }

    get items(): InventoryItemList {
        return this._items;
    }

    constructor(initialItems?: InventoryItemQuantity[]) {
        super();
        if (!!initialItems) {
            this._items = initialItems;
        }
    }

    addInventoryItem(item: InventoryItem, amount: number, tag?: string) {
        if (amount < 1) {
            throw new Error("Amount needs to be a number larger than 0");
        }

        let existingEntry = this._items.find(
            (entry) => entry.item.id == item.id && entry.tag == tag,
        );

        if (!!existingEntry) {
            existingEntry.amount += amount;
        } else {
            this._items.push({
                item: item,
                amount: amount,
                tag: tag,
            });
        }
    }

    amountOf(itemId: string, tag?: string): number {
        return this._items.reduce((accumulator, value) => {
            if (value.item.id == itemId) {
                // If tag is not set add it to accumulator regardless
                if (!tag) {
                    return accumulator + value.amount;
                }

                // Check if the tag matches
                if (tag == value.tag) {
                    return accumulator + value.amount;
                } else {
                    return accumulator;
                }
            } else {
                return accumulator;
            }
        }, 0);
    }

    clear() {
        this._items = [];
    }

    removeInventoryItem(itemId: string, amount: number, tag?: string): boolean {
        const item = this._items.find(
            (entry) => entry.item.id == itemId && entry.tag == tag,
        );

        if (!!item) {
            const amountAfterRemove = item.amount - amount;
            if (amountAfterRemove > 0) {
                item.amount -= amount;
                return true;
            } else if (amountAfterRemove === 0) {
                removeItem(this._items, item);
                return true;
            }
        }

        return false;
    }
}

export function defaultInventoryItems(): InventoryItemQuantity[] {
    return [
        {
            amount: 200000,
            item: woodResourceItem,
        },
        {
            amount: 200000,
            item: wheatResourceItem,
        },
        {
            amount: 47,
            item: stoneResource,
        },
        {
            amount: 1,
            item: bagOfGlitter,
        },
        {
            amount: 3,
            item: gemResource,
        },
        {
            amount: 219,
            item: goldCoins,
        },
        {
            amount: 2,
            item: healthPotion,
        },
        {
            amount: 1,
            item: manaPotion,
        },
        {
            amount: 1,
            item: scroll,
        },
        {
            amount: 1,
            item: blueBook,
        },
        {
            amount: 1,
            item: swordItem,
        },
        {
            amount: 1,
            item: hammerItem,
        },
    ];
}
