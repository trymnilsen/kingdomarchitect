import { InventoryItemQuantity } from "../../../../data/inventory/inventoryItemQuantity.js";
import { Entity } from "../../../entity/entity.js";
import { InventoryComponent2 } from "../../inventory/inventoryComponent.js";
import { JobConstraint } from "../jobConstraint.js";

export class HasInventoryItemJobConstraint implements JobConstraint {
    constructor(readonly item: InventoryItemQuantity) {}
    rankEntity(entity: Entity): number {
        if (this.item.amount == 0) {
            return 1;
        }

        const inventory = entity.getComponent(InventoryComponent2);
        if (!inventory) {
            return 0;
        }

        const amount = inventory.amountOf(this.item.item.id);
        //We set 0.01 as the min value as there might not be any with items
        //in their inventory, but able to fetch it from a stockpile. Returning
        //0 would immediately discard this entity
        const fraction = Math.max(0.01, Math.min(1, amount / this.item.amount));
        return fraction;
    }
}
