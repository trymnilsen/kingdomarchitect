import { hammerItem, swordItem } from "../../../data/inventory/equipment.js";
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
} from "../../../data/inventory/resources.js";
import { EntityComponent } from "../entityComponent.js";

export type InventoryMap = Record<string, InventoryItemQuantity>;

export class InventoryComponent2 extends EntityComponent {
    private _items: InventoryMap = {
        [woodResourceItem.id]: {
            amount: 200000,
            item: woodResourceItem,
        },
        [wheatResourceItem.id]: {
            amount: 200000,
            item: wheatResourceItem,
        },
        [stoneResource.id]: {
            amount: 47,
            item: stoneResource,
        },
        [bagOfGlitter.id]: {
            amount: 1,
            item: bagOfGlitter,
        },
        [gemResource.id]: {
            amount: 3,
            item: gemResource,
        },
        [goldCoins.id]: {
            amount: 219,
            item: goldCoins,
        },
        [healthPotion.id]: {
            amount: 2,
            item: healthPotion,
        },
        [manaPotion.id]: {
            amount: 1,
            item: manaPotion,
        },
        [scroll.id]: {
            amount: 1,
            item: scroll,
        },
        [blueBook.id]: {
            amount: 1,
            item: blueBook,
        },
        [swordItem.id]: {
            amount: 1,
            item: swordItem,
        },
        [hammerItem.id]: {
            amount: 1,
            item: hammerItem,
        },
    };

    get items(): InventoryItemList {
        return Object.values(this._items);
    }

    addInventoryItem(item: InventoryItem, amount: number) {
        if (!this._items[item.id]) {
            this._items[item.id] = {
                amount,
                item,
            };
        } else {
            this._items[item.id].amount += amount;
        }
    }

    hasAmount(itemId: string, amount: number): boolean {
        if (this._items[itemId]) {
            return this._items[itemId].amount >= amount;
        } else {
            return false;
        }
    }

    removeInventoryItem(itemId: string, amount: number): boolean {
        const item = this._items[itemId];
        if (item) {
            if (item.amount > amount) {
                item.amount -= amount;
                return true;
            } else if (item.amount == amount) {
                delete this._items[itemId];
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}
