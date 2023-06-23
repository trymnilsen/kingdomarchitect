function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { hammerItem, swordItem } from "../../../../data/inventory/equipment.js";
import { bagOfGlitter, blueBook, gemResource, goldCoins, healthPotion, manaPotion, scroll, stoneResource, woodResourceItem } from "../../../../data/inventory/resources.js";
import { EntityComponent } from "../entityComponent.js";
export class InventoryComponent extends EntityComponent {
    get items() {
        return Object.values(this._items);
    }
    addInventoryItem(item, amount) {
        if (!this._items[item.id]) {
            this._items[item.id] = {
                amount,
                item
            };
        } else {
            this._items[item.id].amount += amount;
        }
    }
    hasAmount(itemId, amount) {
        if (!!this._items[itemId]) {
            return this._items[itemId].amount >= amount;
        } else {
            return false;
        }
    }
    removeInventoryItem(itemId, amount) {
        const item = this._items[itemId];
        if (!!item) {
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
    constructor(...args){
        super(...args);
        _define_property(this, "_items", {
            [woodResourceItem.id]: {
                amount: 200000,
                item: woodResourceItem
            },
            [stoneResource.id]: {
                amount: 47,
                item: stoneResource
            },
            [bagOfGlitter.id]: {
                amount: 1,
                item: bagOfGlitter
            },
            [gemResource.id]: {
                amount: 3,
                item: gemResource
            },
            [goldCoins.id]: {
                amount: 219,
                item: goldCoins
            },
            [healthPotion.id]: {
                amount: 2,
                item: healthPotion
            },
            [manaPotion.id]: {
                amount: 1,
                item: manaPotion
            },
            [scroll.id]: {
                amount: 1,
                item: scroll
            },
            [blueBook.id]: {
                amount: 1,
                item: blueBook
            },
            [swordItem.id]: {
                amount: 1,
                item: swordItem
            },
            [hammerItem.id]: {
                amount: 1,
                item: hammerItem
            }
        });
    }
}
